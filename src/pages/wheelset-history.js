import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useState } from "react";

const transformAndGroupData = (data) => {
  const transformedData = data.map(
    ({ Locomotive_Number, Work_Order, ...rest }) => ({
      ...rest,
      Name: Locomotive_Number?.Name || "-",
      Homologation_Date: Locomotive_Number?.Homologation_Date || "-",
      Locomotive_Number: Locomotive_Number?.Locomotive_Number || "-",
      Locomotive_id: Locomotive_Number?._id || "-",
      Work_Order_Name: Work_Order?.Name || "-",
      Work_Order_Number: Work_Order?.wonum || "-",
      Date: rest?.date || "-",
      D_LEFT: rest?.D_LEFT || 0,
      D_RIGHT: rest?.D_RIGHT || 0,
    })
  );

  const groupedData = {};
  console.log(transformedData, "transaform Data");
  transformedData.forEach((item) => {
    const dateKey = item.Measure_Date || "-";

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = {
        Description: item.Description || "-",
        Measure_Date: item.Measure_Date || "-",
        Locomotive_Number: item.Locomotive_Number || "-",
        Locomotive_Number_id: item.Locomotive_Number_id || "-",
        Homologation_Date: item.Homologation_Date || "-",
        Work_Order_Name: item.Work_Order_Name || "-",
        D1_LEFT: null,
        D1_RIGHT: null,
        D2_LEFT: null,
        D2_RIGHT: null,
        D3_LEFT: null,
        D3_RIGHT: null,
        D4_LEFT: null,
        D4_RIGHT: null,
      };
    }

    const position = item.Position;
    console.log(item.Measure_Date);
    if (position === "Position 1") {
      groupedData[dateKey]["D1_LEFT"] = item.D_LEFT || 0;
      groupedData[dateKey]["D1_RIGHT"] = item.D_RIGHT || 0;
    } else if (position === "Position 2") {
      groupedData[dateKey]["D2_LEFT"] = item.D_LEFT || 0;
      groupedData[dateKey]["D2_RIGHT"] = item.D_RIGHT || 0;
    } else if (position === "Position 3") {
      groupedData[dateKey]["D3_LEFT"] = item.D_LEFT || 0;
      groupedData[dateKey]["D3_RIGHT"] = item.D_RIGHT || 0;
    } else if (position === "Position 4") {
      groupedData[dateKey]["D4_LEFT"] = item.D_LEFT || 0;
      groupedData[dateKey]["D4_RIGHT"] = item.D_RIGHT || 0;
    }
  });

  return Object.values(groupedData);
};

const getColumns = () => [
  { field: "Description", header: "Description" },
  { field: "Measure_Date", header: "Measure Date" },
  { field: "D1_LEFT", header: "D1 LEFT" },
  { field: "D1_RIGHT", header: "D1 RIGHT" },
  { field: "D2_LEFT", header: "D2 LEFT" },
  { field: "D2_RIGHT", header: "D2 RIGHT" },
  { field: "D3_LEFT", header: "D3 LEFT" },
  { field: "D3_RIGHT", header: "D3 RIGHT" },
  { field: "D4_LEFT", header: "D4 LEFT" },
  { field: "D4_RIGHT", header: "D4 RIGHT" },
];

const DataTableComponent = ({ result }) => {
  const [selectedRow, setSelectedRow] = useState(null);

  const transformedGroupedData = transformAndGroupData(result.Data);
  const columns = getColumns();
  console.log(result.Data);
  return (
    <div className="flex justify-center p-14 flex-col">
      <h2 className="text-xl font-semibold my-3">History 119 001-5</h2>
      <div className="w-full">
        <DataTable
          value={transformedGroupedData}
          showGridlines
          paginator
          paginatorLeft
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          dataKey="Measure_Date"
          selectionMode="single"
          selection={selectedRow}
          onSelectionChange={(e) => setSelectedRow(e.value)}
        >
          {columns.map((col, i) => (
            <Column key={i} field={col.field} header={col.header} />
          ))}
        </DataTable>
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  try {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;
    const formId = process.env.NEXT_PUBLIC_WHEELSET_MEASURMENT_FORM_ID;

    const response = await fetch(
      `${baseURL}/form/2/${accountId}/${formId}/list?page_size=1000`,
      {
        method: "GET",
        headers: {
          "X-Access-Key-Id": process.env.NEXT_PUBLIC_ACCESS_KEY_ID,
          "X-Access-Key-Secret": process.env.NEXT_PUBLIC_ACCESS_KEY_SECRET,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      props: { result },
    };
  } catch (error) {
    console.log("Failed to fetch KissFlow API data:", error);

    return {
      props: { result: { Data: [] } },
    };
  }
}

export default DataTableComponent;
