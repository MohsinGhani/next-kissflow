import React, { useState, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const Table = ({ result }) => {
  const [expandedRows, setExpandedRows] = useState([]);

  const groupCosts = (cost) => {
    return result.Data.reduce((acc, item) => {
      const description = item.Loco_Description || "Unknown";
      const date = item.Next_Due_Date;
      if (date && typeof date === "string") {
        const year = date.split("-")[0];
        const costValue =
          parseFloat(item[cost]?.replace(" EUR", "").replace(",", ".")) || 0;

        if (!acc[description]) {
          acc[description] = { description, years: {} };
        }

        if (!acc[description].years[year]) {
          acc[description].years[year] = 0;
        }

        acc[description].years[year] += costValue;
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
      details: Object.values(details),
    });

    return [
      createGroup("Labor Costs", laborCost),
      createGroup("Tool Costs", toolCost),
      createGroup("Service Costs", serviceCost),
      createGroup("Item Costs", itemCost),
    ];
  }, [result.Data]);

  const allYears = useMemo(() => {
    const yearsSet = new Set();
    groupedData.forEach(({ details }) =>
      details.forEach(({ years }) =>
        Object.keys(years).forEach((year) => yearsSet.add(year))
      )
    );
    return [...yearsSet].sort();
  }, [groupedData]);

  const yearTotals = useMemo(() => {
    const totals = {};
    allYears.forEach((year) => {
      totals[year] = groupedData.reduce(
        (acc, { details }) =>
          acc +
          details.reduce(
            (descAcc, { years }) => descAcc + (years[year] || 0),
            0
          ),
        0
      );
    });
    return totals;
  }, [groupedData, allYears]);

  const grandTotal = useMemo(() => {
    return groupedData.reduce(
      (acc, { details }) =>
        acc +
        details.reduce(
          (descAcc, { years }) =>
            descAcc +
            Object.values(years).reduce((yearAcc, total) => yearAcc + total, 0),
          0
        ),
      0
    );
  }, [groupedData]);

  const renderYearColumns = () => {
    return allYears.map((year) => (
      <Column
        key={year}
        field={year}
        header={year}
        body={({ details }) => {
          const total = details.reduce(
            (acc, { years }) => acc + (years[year] || 0),
            0
          );
          return (
            <div className="p-2">
              {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
            </div>
          );
        }}
      />
    ));
  };

  const rowExpansionTemplate = ({ details }) => (
    <DataTable
      value={details}
      tableStyle={{ minWidth: "90rem" }}
      header={false}
    >
      <Column />
      <Column field="description" header="Description" />
      {allYears.map((year) => (
        <Column
          key={year}
          field={year}
          // header={year}
          body={(rowData) => {
            const total = rowData.years[year] || 0;
            return total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR";
          }}
        />
      ))}
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
      >
        <Column expander style={{ width: "10px" }} />
        <Column field="label" header="Cost Type" />
        {renderYearColumns()}
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
