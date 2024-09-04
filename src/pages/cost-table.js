import React, { useState, useMemo, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const Table = ({ result }) => {
  const [expandedRows, setExpandedRows] = useState([]);

  const groupCosts = (cost) => {
    return result.Data.reduce((acc, item) => {
      let description = item.Loco_Description || "Unknown";
      const costValue =
        parseFloat(item[cost]?.replace(" EUR", "").replace(",", ".")) || 0;

      if (description === "undefined") {
        description = "Unknown";
      }

      if (costValue > 0) {
        acc[description] = acc[description] || { description, total: 0 };
        acc[description].total += costValue;
      }
      return acc;
    }, {});
  };

  const groupedData = useMemo(() => {
    const laborCost = groupCosts("Estimated_Labor_Cost");
    const toolCost = groupCosts("Estimated_Tool_Cost");
    const serviceCost = groupCosts("Estimated_Service_Cost");
    const itemCost = groupCosts("Estimated_Item_Cost");

    const createGroup = (label, details) => ({
      label,
      value: Object.values(details).reduce((acc, cur) => acc + cur.total, 0),
      details: Object.values(details),
    });

    const data = [
      createGroup("Labor Costs", laborCost),
      createGroup("Tool Costs", toolCost),
      createGroup("Service Costs", serviceCost),
      createGroup("Item Costs", itemCost),
    ];

    return data;
  }, [result.Data]);

  const grandTotal = groupedData.reduce((acc, { value }) => acc + value, 0);

  const rowExpansionTemplate = ({ details }) => (
    <DataTable value={details} tableStyle={{ minWidth: "50rem" }} showGridlines>
      <Column
        field="description"
        header="Description"
        style={{ width: "25rem" }}
      />
      <Column
        field="total"
        header="Total Cost"
        body={(row) => `${row.total.toFixed(2)} EUR`}
      />
    </DataTable>
  );

  return (
    <div className="card m-4">
      <DataTable
        value={groupedData}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        dataKey="label"
        sho
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="label" header="Cost Type" style={{ width: "22rem" }} />
        <Column
          field="value"
          header="Total Cost"
          body={({ value }) => `${value.toFixed(2)} EUR`}
        />
      </DataTable>
      <div style={{ textAlign: "right", padding: "1rem", fontWeight: "bold" }}>
        Grand Total: {grandTotal.toFixed(2)} EUR
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  try {
    const {
      NEXT_PUBLIC_BASE_URL: baseURL,
      NEXT_PUBLIC_ACCOUNT_ID: accountId,
      NEXT_PUBLIC_FORM_ID: formId,
      NEXT_PUBLIC_ACCESS_KEY_ID: accessKeyId,
      NEXT_PUBLIC_ACCESS_KEY_SECRET: accessKeySecret,
    } = process.env;

    const response = await fetch(
      `${baseURL}/form/2/${accountId}/${formId}/list?page_size=100`,
      {
        method: "GET",
        headers: {
          "X-Access-Key-Id": accessKeyId,
          "X-Access-Key-Secret": accessKeySecret,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    return { props: { result } };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return { props: { result: { Data: [] } } };
  }
}

export default Table;
