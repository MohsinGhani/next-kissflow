import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// Transform data to flatten nested objects
const transformData = (data) =>
  data.map(({ Locomotive_Number, Work_Order, ...rest }) => ({
    ...rest,
    Name: Locomotive_Number?.Name || "-",
    Homologation_Date: Locomotive_Number?.Homologation_Date || "-",
    Locomotive_Number: Locomotive_Number?.Locomotive_Number || "-",
    Work_Order_Name: Work_Order?.Name || "-",
    Work_Order_Number: Work_Order?.wonum || "-",
  }));

// Generate dynamic columns and prioritize certain fields
const getColumns = (data) => {
  if (!data.length) return [];

  const priorityFields = [
    "Locomotive_Number",
    "Homologation_Date",
    "Work_Order_Number",
  ];

  const firstItem = data[0];
  const remainingFields = Object.keys(firstItem).filter(
    (key) => !key.toLowerCase().includes("_id") && !priorityFields.includes(key)
  );

  // Combine priority and remaining fields
  const allFields = [...priorityFields, ...remainingFields];

  return allFields.map((key) => ({
    field: key,
    header: key
      .replace(/_/g, " ")
      .replace(/\b[a-z]/g, (char) => char.toUpperCase()),
  }));
};

const MyDataTable = ({ result }) => {
  const flattenedData = transformData(result.Data);
  const columns = getColumns(flattenedData);

  return (
    <div className="flex justify-center p-14 flex-col">
      <h2 className="text-xl font-semibold my-3">History 119 001-5</h2>
      <div className="w-full">
        <DataTable
          showGridlines
          value={flattenedData}
          paginatorLeft
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              style={{
                padding: "13px",
                minWidth:
                  col.field === "Name" || col.field === "Work_Order_Name"
                    ? "300px"
                    : "200px",
              }}
              body={(rowData) => rowData[col.field] || "-"}
            />
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

export default MyDataTable;
