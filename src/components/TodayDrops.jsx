import React from "react";
import FileUploadSupabase from "./FileUploadSupabase";
import DataTableSupabase from "./DataTableSupabase";
//import FileUpload from "./FileUpload";
//import DataTable from "./DataTable";

const TodayDrops = () => {
  return (
    <div className="flex-grow w-full mx-auto pt-20">
     <FileUploadSupabase />
     <DataTableSupabase />
    </div>
  );
};

export default TodayDrops;
