import React from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { db } from "../../firebase";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";

export default function FileUpload() {
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length === 0) return;
      const versionId = new Date().toISOString();
      await setDoc(doc(db, "meta", versionId), { headers: jsonData[0] });
      const batch = writeBatch(db);
      const rowsCol = collection(db, "uploads", versionId, "rows");
      jsonData.slice(1).forEach((row, i) => {
        const rowRef = doc(rowsCol, `row_${i}`);
        batch.set(rowRef, { cells: row, status: "", name: "" });
      });
      await batch.commit();
    };
    reader.readAsArrayBuffer(file);
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-indigo-400 rounded-xl p-8 text-center cursor-pointer bg-white shadow-md hover:bg-indigo-50 transition"
    >
      <input {...getInputProps()} />
      <p className="text-lg text-gray-700">
        Drag & drop your Excel file here, or{" "}
        <span className="text-indigo-600 font-bold">click to upload</span>
      </p>
    </div>
  );
}
