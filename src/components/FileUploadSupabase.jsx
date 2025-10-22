import React from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid"; // Install: npm i uuid

export default function FileUploadSupabase({ onUploadComplete }) {
  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) return;

      const versionId = new Date().toISOString(); // or uuidv4()
      
      // Insert into meta table
      const { error: metaError } = await supabase
        .from("meta")
        .insert([{ id: versionId, headers: jsonData[0] }]);
      if (metaError) {
        console.error("Meta insert error:", metaError);
        return;
      }

      // Insert rows into uploads table
      const rowsData = jsonData.slice(1).map((row) => ({
        id: uuidv4(),
        version_id: versionId,
        cells: row,
        status: "",
        name: "",
      }));

      const { error: uploadError } = await supabase
        .from("uploads")
        .insert(rowsData);

      if (uploadError) {
        console.error("Uploads insert error:", uploadError);
        return;
      }

      // Notify parent/dashboard to refresh
      if (onUploadComplete) onUploadComplete(versionId);
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
