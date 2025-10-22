import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function diffDuration(startIso, endIso) {
  if (!startIso || !endIso) return "—";
  const start = new Date(startIso);
  const end = new Date(endIso);
  let diff = Math.max(0, Math.floor((end - start) / 1000));
  const days = Math.floor(diff / (3600 * 24));
  diff -= days * 3600 * 24;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  return `${days}d ${hours}h ${minutes}m`;
}
function numeric(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function format12Hour(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
}
export default function PayPendingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
  if (showForm) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}, [showForm]);
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(1);
  const [followupRecord, setFollowupRecord] = useState(null);
  const [followList, setFollowList] = useState([]);
  const [newFollow, setNewFollow] = useState({
    executive_name: "",
    remarks: "",
  });
  const pageSize = 12;
  useEffect(() => {
    fetchItems();
    const subscription = supabase
      .channel("public:pay_pending")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pay_pending" },
        () => fetchItems()
      )
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);
  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pay_pending")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  }
  async function fetchFollowups(payId) {
    const { data, error } = await supabase
      .from("follow_up_history")
      .select("*")
      .eq("pay_pending_id", payId)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setFollowList(data || []);
  }
  async function addFollow(payId) {
    if (!newFollow.executive_name || !newFollow.remarks) return;
    const { error } = await supabase.from("follow_up_history").insert({
      pay_pending_id: payId,
      executive_name: newFollow.executive_name,
      remarks: newFollow.remarks,
    });
    if (error) console.error(error);
    await fetchFollowups(payId);
    setNewFollow({ executive_name: "", remarks: "" });
  }
  async function markPaid(id) {
  const { error } = await supabase
    .from("pay_pending")
    .update({ status: "paid" })
    .eq("id", id);
  if (error) {
    console.error(error);
    return;
  }
  setItems((prev) =>
    prev.map((item) =>
      item.id === id ? { ...item, status: "paid" } : item
    )
  );
}

  const grandTotalPending = useMemo(() => {
  return items
    .filter((it) => it.status !== "paid") 
    .reduce(
      (s, it) => s + numeric(it.pending_current) + numeric(it.pending_previous)+ numeric(it.extra_charges),
      0
    );
}, [items]);

  const paged = useMemo(() => {
    const filtered = items.filter(
      (it) =>
        !filterText ||
        it.booking_id?.toLowerCase().includes(filterText.toLowerCase()) ||
        it.customer_name?.toLowerCase().includes(filterText.toLowerCase())
    );
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [items, filterText, page]);
  function emptyForm() {
    return {
      booking_id: "",
      customer_name: "",
      ride_ext_from: null,
      ride_ext_upto: null,
      extended_by: "",
      followup_name: "",
      remarks: "",
      pending_current: 0,
      pending_previous: 0,
      extra_charges: 0,
      chk_damage: false,
      chk_penality: false,
      chk_breakdown: false,
      chk_overdue: false,
      chk_homedelivery: false,
      chk_upgrade: false,
      chk_exchange: false,
      chk_other: false,
      chk_other_desc: "",
      total_amount: 0,
      payment_expected_at: null,
      date: null,
      duration_minutes: null,
      priority: "medium",
      assigned_to: "",
      status: "pending",
    };
  }
  function openNew() {
    setEditing(emptyForm());
    setShowForm(true);
  }
  function openEdit(item) {
    setEditing({
      ...item,
      ride_ext_from: item.ride_ext_from ? new Date(item.ride_ext_from) : null,
      ride_ext_upto: item.ride_ext_upto ? new Date(item.ride_ext_upto) : null,
      date: item.date ? new Date(item.date) : null,
    });
    setShowForm(true);
  }
  async function save() {
    if (!editing) return;
    const record = { ...editing };
    if (record.ride_ext_from && record.ride_ext_upto)
      record.duration_minutes = Math.max(
        0,
        Math.round((record.ride_ext_upto - record.ride_ext_from) / 60000)
      );
    record.total_amount =
      numeric(record.pending_current) +
      numeric(record.pending_previous) +
      numeric(record.extra_charges);
    record.ride_ext_from = record.ride_ext_from
      ? record.ride_ext_from.toISOString()
      : null;
    record.ride_ext_upto = record.ride_ext_upto
      ? record.ride_ext_upto.toISOString()
      : null;
    record.date = record.date ? record.date.toISOString() : null;
    record.payment_expected_at = record.payment_expected_at
      ? new Date(record.payment_expected_at).toISOString()
      : null;
    const { error } = record.id
      ? await supabase.from("pay_pending").update(record).eq("id", record.id)
      : await supabase.from("pay_pending").insert(record);
    if (error) console.error(error);
    setShowForm(false);
    setEditing(null);
    fetchItems();
  }
  return (
    <div className="p-4 max-w-7xl mx-auto mt-14">
      <div className="flex flex-row flex-wrap items-center justify-between gap-2 mb-4 text-xs sm:text-sm">
        <h1 className="text-lg sm:text-2xl font-semibold">Pay Pending</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="text-xs sm:text-sm">Grand Total Pending:</div>
          <div className="text-sm sm:text-xl font-bold">
            ₹ {grandTotalPending.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="mb-4 flex flex-row flex-wrap gap-2 text-xs sm:text-sm">
        <input
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setPage(1);
          }}
          placeholder="Search booking id or customer"
          className="flex-1 p-1 sm:p-2 border rounded shadow-sm min-w-[140px]"
        />
        <button
          onClick={openNew}
          className="px-2 py-1 sm:px-4 sm:py-2 rounded bg-indigo-600 text-white"
        >
          New
        </button>
        <button
          onClick={fetchItems}
          className="px-2 py-1 sm:px-4 sm:py-2 rounded border bg-gray-100"
        >
          Refresh
        </button>
      </div>
      {showForm && editing && (
        <div className="mb-4 bg-white p-3 sm:p-4 rounded shadow-sm w-full text-xs sm:text-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base sm:text-lg font-medium">
              {editing.id ? "Edit Record" : "New Record"}
            </h2>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(false);
              }}
              className="px-2 py-1 sm:px-3 sm:py-1 border rounded"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col">
                <label className="mb-1">Record Date</label>
                <DatePicker
                  selected={editing.date}
                  onChange={(d) => setEditing({ ...editing, date: d })}
                  showTimeSelect
                  dateFormat="dd-MM-yyyy hh:mm aa"
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1">Booking ID</label>
                <input
                  value={editing.booking_id}
                  onChange={(e) =>
                    setEditing({ ...editing, booking_id: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1">Customer Name</label>
                <input
                  value={editing.customer_name}
                  onChange={(e) =>
                    setEditing({ ...editing, customer_name: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col">
                <label className="mb-1">Pick Up/Drop Off</label>
                <DatePicker
                  selected={editing.ride_ext_from}
                  onChange={(d) => setEditing({ ...editing, ride_ext_from: d })}
                  showTimeSelect
                  dateFormat="dd-MM-yyyy hh:mm aa"
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1">Drop Off/New Drop Off</label>
                <DatePicker
                  selected={editing.ride_ext_upto}
                  onChange={(d) => setEditing({ ...editing, ride_ext_upto: d })}
                  showTimeSelect
                  dateFormat="dd-MM-yyyy hh:mm aa"
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1">Extended By</label>
                <input
                  value={editing.extended_by}
                  onChange={(e) =>
                    setEditing({ ...editing, extended_by: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="mb-1">Remarks</label>
              <textarea
                value={editing.remarks}
                onChange={(e) => setEditing({ ...editing, remarks: e.target.value })}
                className="w-full p-1 sm:p-2 border rounded"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: "Extension Amount", key: "pending_current" },
                { label: "Previous Balance", key: "pending_previous" },
                { label: "Extra Charges", key: "extra_charges" },
              ].map((field) => (
                <div key={field.key} className="flex flex-col">
                  <label className="mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={editing[field.key]}
                    onChange={(e) =>
                      setEditing({ ...editing, [field.key]: e.target.value })
                    }
                    className="w-full p-1 sm:p-2 border rounded"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {[
                "Damage",
                "Penalty",
                "Breakdown",
                "Overdue",
                "Home Delivery",
                "Upgrade",
                "Exchange",
                "Other",
              ].map((label, idx) => {
                const key = `chk_${label.toLowerCase().replace(" ", "")}`;
                return (
                  <label key={idx} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing[key]}
                      onChange={(e) =>
                        setEditing({ ...editing, [key]: e.target.checked })
                      }
                      className="mr-2"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            {editing.chk_other && (
              <div>
                <label className="mb-1">Other Description</label>
                <input
                  value={editing.chk_other_desc}
                  onChange={(e) =>
                    setEditing({ ...editing, chk_other_desc: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <div className="flex flex-col">
                <label className="mb-1">Priority</label>
                <select
                  value={editing.priority}
                  onChange={(e) =>
                    setEditing({ ...editing, priority: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1">Assigned Executive</label>
                <input
                  value={editing.assigned_to}
                  onChange={(e) =>
                    setEditing({ ...editing, assigned_to: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1">Status</label>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value })
                  }
                  className="w-full p-1 sm:p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={save}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded shadow-sm overflow-hidden w-full">
        <div className="hidden md:block">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-600">
                <th className="p-2">Booking ID</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Pick Up</th>
                <th className="p-2">Drop Off</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Pending</th>
                <th className="p-2">Total</th>
                <th className="p-2">Extended By</th>
                <th className="p-2">Assigned</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11}>Loading...</td>
                </tr>
              ) : paged.length ? (
                paged.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="p-2">{row.booking_id}</td>
                      <td className="p-2">{row.customer_name}</td>
                      <td className="p-2">{format12Hour(row.ride_ext_from)}</td>
                      <td className="p-2">{format12Hour(row.ride_ext_upto)}</td>
                      <td className="p-2">
                        {diffDuration(row.ride_ext_from, row.ride_ext_upto)}
                      </td>
                      <td className="p-2">
                        ₹
                        {numeric(
                          row.pending_current + row.pending_previous
                        ).toFixed(2)}
                      </td>
                      <td className="p-2">
                        ₹{numeric(row.total_amount).toFixed(2)}
                      </td>
                      <td className="p-2">{row.extended_by || "-"}</td>
                      <td className="p-2">{row.assigned_to}</td>
                      <td
                        className={`p-2 ${
                          row.status === "paid"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {row.status}
                      </td>
                      <td className="p-2 flex gap-1 flex-wrap">
                        <button
                          onClick={() => openEdit(row)}
                          className="px-2 py-1 text-xs border rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setFollowupRecord(row);
                            fetchFollowups(row.id);
                          }}
                          className="px-2 py-1 text-xs border rounded bg-yellow-50"
                        >
                          Follow-up
                        </button>
                        {row.status === "paid" ? (
                          <span className="px-2 py-1 text-xs border rounded bg-green-600 text-white">
                            Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              markPaid(row.id);
                              setItems((prev) =>
                                prev.map((item) =>
                                  item.id === row.id ? { ...item, status: "paid" } : item
                                )
                              );
                            }}
                            className="px-2 py-1 text-xs border rounded bg-red-600 text-white"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                    {row.remarks && (
                      <tr className="bg-gray-50 text-xs text-gray-700">
                        <td colSpan={10} className="p-2">
                          <strong>Recent Remark:</strong> {row.remarks}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4 p-2">
          {loading ? (
            <p>Loading...</p>
          ) : paged.length ? (
            paged.map((row) => (
              <div key={row.id} className="bg-white shadow-md rounded-lg p-4 border">
                <p><span className="font-semibold">Booking ID:</span> {row.booking_id}</p>
                <p><span className="font-semibold">Customer:</span> {row.customer_name}</p>
                <p><span className="font-semibold">Pick Up:</span> {format12Hour(row.ride_ext_from)}</p>
                <p><span className="font-semibold">Drop Off:</span> {format12Hour(row.ride_ext_upto)}</p>
                <p><span className="font-semibold">Duration:</span> {diffDuration(row.ride_ext_from, row.ride_ext_upto)}</p>
                <p><span className="font-semibold">Pending:</span> ₹
                  {numeric(row.pending_current + row.pending_previous).toFixed(2)}
                </p>
                <p><span className="font-semibold">Total:</span> ₹
                  {numeric(row.total_amount).toFixed(2)}
                </p>
                <p><span className="font-semibold">Extended By:</span> {row.extended_by || "-"}</p>
                <p><span className="font-semibold">Assigned:</span> {row.assigned_to}</p>
                <p className={`font-semibold ${row.status === "paid" ? "text-green-600" : "text-red-600"}`}>
                  Status: {row.status}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(row)} className="px-3 py-1 text-xs border rounded">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setFollowupRecord(row);
                      fetchFollowups(row.id);
                    }}
                    className="px-3 py-1 text-xs border rounded bg-yellow-50"
                  >
                    Follow-up
                  </button>
                  {row.status === "paid" ? (
                    <span className="px-3 py-1 text-xs border rounded bg-green-600 text-white">Paid</span>
                  ) : (
                    <button
                      onClick={() => {
                        markPaid(row.id);
                        setItems((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, status: "paid" } : item
                          )
                        );
                      }}
                      className="px-3 py-1 text-xs border rounded bg-red-600 text-white"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
                {row.remarks && (
                  <p className="mt-2 text-xs text-gray-600">
                    <strong>Remark:</strong> {row.remarks}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No records found.</p>
          )}
        </div>
      </div>
      {followupRecord && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-end md:items-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-xl w-full md:w-[500px] p-4 relative shadow-lg">
            <button
              onClick={() => setFollowupRecord(null)}
              className="absolute top-2 right-2 px-2 py-1 text-xs border rounded"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-3">
              Follow-up History — {followupRecord.booking_id}
            </h2>
            <div className="max-h-[250px] overflow-y-auto border rounded mb-3">
              {followList.length === 0 ? (
                <div className="p-2 text-sm text-gray-500 text-center">
                  No follow-ups yet
                </div>
              ) : (
                followList.map((f) => (
                  <div
                    key={f.id}
                    className="p-2 border-b text-sm flex flex-col gap-0.5"
                  >
                    <div>
                      <strong>{f.executive_name}</strong> —{" "}
                      {new Date(f.created_at).toLocaleString()}
                    </div>
                    <div>{f.remarks}</div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <input
                placeholder="Executive Name"
                value={newFollow.executive_name}
                onChange={(e) =>
                  setNewFollow({ ...newFollow, executive_name: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Remarks"
                value={newFollow.remarks}
                onChange={(e) =>
                  setNewFollow({ ...newFollow, remarks: e.target.value })
                }
                className="w-full p-2 border rounded"
                rows={3}
              />
              <div className="flex justify-between">
                <button
                  onClick={() => addFollow(followupRecord.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Add Follow-up
                </button>
                {followupRecord.status === "paid" ? (
                  <span className="px-4 py-2 bg-green-600 text-white rounded">
                    Paid
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      markPaid(followupRecord.id);
                      setItems((prev) =>
                        prev.map((item) =>
                          item.id === followupRecord.id ? { ...item, status: "paid" } : item
                        )
                      );
                      setFollowupRecord(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
