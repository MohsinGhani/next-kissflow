import React, { useState, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const useQuarterMapping = () =>
  useMemo(
    () => ({
      Q1: ["01", "02", "03"],
      Q2: ["04", "05", "06"],
      Q3: ["07", "08", "09"],
      Q4: ["10", "11", "12"],
    }),
    []
  );

const groupCosts = (result, cost, quarterMapping) => {
  return result.Data.reduce((acc, item) => {
    const description = item.Loco_Description || "Unknown";
    const date = item.Next_Due_Date;
    if (date && typeof date === "string") {
      const [year, month] = date.split("-");
      const quarter = Object.keys(quarterMapping).find((q) =>
        quarterMapping[q].includes(month)
      );
      const costValue =
        parseFloat(item[cost]?.replace(" EUR", "").replace(",", ".")) || 0;

      if (!acc[description]) {
        acc[description] = { description, years: {} };
      }

      if (!acc[description].years[year]) {
        acc[description].years[year] = { total: 0, quarters: {} };
      }

      if (!acc[description].years[year].quarters[quarter]) {
        acc[description].years[year].quarters[quarter] = {
          total: 0,
          months: {},
        };
      }

      acc[description].years[year].total += costValue;
      acc[description].years[year].quarters[quarter].total += costValue;
      acc[description].years[year].quarters[quarter].months[month] =
        (acc[description].years[year].quarters[quarter].months[month] || 0) +
        costValue;
    }

    return acc;
  }, {});
};

const createGroupedData = (result, quarterMapping) => {
  const laborCost = groupCosts(result, "Estimated_Labor_Cost", quarterMapping);
  const toolCost = groupCosts(result, "Estimated_Tool_Cost", quarterMapping);
  const serviceCost = groupCosts(
    result,
    "Estimated_Service_Cost",
    quarterMapping
  );
  const itemCost = groupCosts(result, "Estimated_Item_Cost", quarterMapping);

  const calculateTotalCosts = () => {
    const allCosts = [laborCost, toolCost, serviceCost, itemCost];
    const totalCosts = {};

    allCosts.forEach((costGroup) => {
      Object.keys(costGroup).forEach((description) => {
        if (!totalCosts[description]) {
          totalCosts[description] = { description, years: {} };
        }

        Object.keys(costGroup[description].years).forEach((year) => {
          if (!totalCosts[description].years[year]) {
            totalCosts[description].years[year] = { total: 0, quarters: {} };
          }

          totalCosts[description].years[year].total +=
            costGroup[description].years[year].total;

          Object.keys(costGroup[description].years[year].quarters).forEach(
            (quarter) => {
              if (!totalCosts[description].years[year].quarters[quarter]) {
                totalCosts[description].years[year].quarters[quarter] = {
                  total: 0,
                  months: {},
                };
              }

              totalCosts[description].years[year].quarters[quarter].total +=
                costGroup[description].years[year].quarters[quarter].total;
            }
          );
        });
      });
    });

    return totalCosts;
  };

  const createGroup = (label, details) => ({
    label,
    details: Object.values(details ?? {}),
  });

  return [
    createGroup("Labor Cost", laborCost),
    createGroup("Tool Cost", toolCost),
    createGroup("Service Cost", serviceCost),
    createGroup("Item Cost", itemCost),
    createGroup("Total Cost", calculateTotalCosts()),
  ];
};

const useAllYears = (groupedData) =>
  useMemo(() => {
    const yearsSet = new Set();
    groupedData.forEach(({ details }) =>
      details.forEach(({ years }) =>
        Object.keys(years).forEach((year) => yearsSet.add(year))
      )
    );
    return [...yearsSet].sort();
  }, [groupedData]);

const Table = ({ result }) => {
  console.log(result, "res");
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandedQuarters, setExpandedQuarters] = useState(new Set());
  const quarterMapping = useQuarterMapping();
  const groupedData = useMemo(
    () => createGroupedData(result, quarterMapping),
    [result, quarterMapping]
  );
  const allYears = useAllYears(groupedData);

  const handleYearToggle = (year) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };
  const renderTotalYearColumns = () =>
    allYears.map((year) => (
      <Column
        key={year}
        field={year}
        header={
          <div>
            <button
              className="btn-quarter-toggle"
              onClick={() => handleYearToggle(year)}
            >
              {year}
            </button>
          </div>
        }
        body={({ details }) => {
          if (!details || !Array.isArray(details)) {
            return "0 EUR";
          }
          const total = details.reduce(
            (acc, { years }) => acc + (years[year]?.total || 0),
            0
          );
          return total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR";
        }}
        className="table-field-style"
      />
    ));
  const renderTotalQuarterColumns = () =>
    Array.from(expandedYears).flatMap((year) =>
      ["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
        <Column
          key={`${year}-${quarter}`}
          field={`${year}-${quarter}`}
          header={
            <div>
              <button
                className="btn-quarter-toggle"
                onClick={() => handleQuarterToggle(year, quarter)}
              >
                {quarter}
              </button>
            </div>
          }
          body={({ details }) => {
            if (!Array.isArray(details)) {
              return <div>0 EUR</div>;
            }
            const total = details.reduce(
              (acc, { years }) =>
                acc + (years[year]?.quarters[quarter]?.total || 0),
              0
            );
            return total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR";
          }}
          className="table-field-style"
        />
      ))
    );

  const renderTotalMonthColumns = () =>
    Array.from(expandedQuarters).flatMap((key) => {
      const [year, quarter] = key.split("-");
      return quarterMapping[quarter].map((month) => (
        <Column
          key={`${year}-${quarter}-${month}`}
          field={`${year}-${quarter}-${month}`}
          header={month}
          body={({ details }) => {
            if (!details || !Array.isArray(details)) {
              return "0 EUR";
            }
            const monthlyCost = details.reduce(
              (acc, { years }) =>
                acc + (years[year]?.quarters[quarter]?.months[month] || 0),
              0
            );
            return monthlyCost > 0 ? `${monthlyCost.toFixed(2)} EUR` : "0 EUR";
          }}
          className="table-field-style"
        />
      ));
    });
  const getTotalColumnComponents = () => {
    const yearColumns = renderTotalYearColumns();
    const quarterColumns = renderTotalQuarterColumns();
    const monthColumns = renderTotalMonthColumns();

    return yearColumns.flatMap((yearColumn) => {
      const year = yearColumn.key;

      const relatedQuarterColumns = quarterColumns.filter((qCol) =>
        qCol.key.startsWith(`${year}-`)
      );

      return [
        yearColumn,
        ...relatedQuarterColumns.flatMap((quarterColumn) => {
          const quarter = quarterColumn.key.split("-")[1];

          const relatedMonthColumns = monthColumns.filter((mCol) =>
            mCol.key.startsWith(`${year}-${quarter}-`)
          );

          return [quarterColumn, ...relatedMonthColumns];
        }),
      ];
    });
  };

  const handleQuarterToggle = (year, quarter) => {
    const key = `${year}-${quarter}`;
    setExpandedQuarters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderYearColumns = () =>
    allYears.map((year) => (
      <Column
        key={year}
        field={year}
        header={
          <div>
            <button
              className="btn-year-toggle"
              onClick={() => handleYearToggle(year)}
            >
              {year}
            </button>
          </div>
        }
        body={({ years }) => {
          if (!years || !years[year]) {
            return "0 EUR";
          }
          const total = years[year]?.total || 0;
          return total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR";
        }}
        className="table-field-style"
      />
    ));

  const renderMonthColumns = () =>
    Array.from(expandedQuarters).flatMap((key) => {
      const [year, quarter] = key.split("-");
      return quarterMapping[quarter].map((month) => (
        <Column
          key={`${year}-${quarter}-${month}`}
          field={`${year}-${quarter}-${month}`}
          header={month}
          body={({ years }) => {
            if (!years || !years[year] || !years[year].quarters[quarter]) {
              return "0 EUR";
            }
            const monthlyCost =
              years[year].quarters[quarter].months[month] || 0;
            return monthlyCost > 0 ? `${monthlyCost.toFixed(2)} EUR` : "0 EUR";
          }}
          className="table-field-style"
        />
      ));
    });

  const renderQuarterColumns = () =>
    Array.from(expandedYears).flatMap((year) =>
      ["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
        <Column
          key={`${year}-${quarter}`}
          field={`${year}-${quarter}`}
          header={
            <div>
              <button
                className="btn-quarter-toggle"
                onClick={() => handleQuarterToggle(year, quarter)}
              >
                {quarter}
              </button>
            </div>
          }
          body={({ years }) => {
            if (!years || !years[year] || !years[year].quarters) {
              return "0 EUR";
            }
            const total = years[year].quarters[quarter]?.total || 0;
            return total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR";
          }}
          className="table-field-style"
        />
      ))
    );
  const getColumnComponents = () => {
    const yearColumns = renderYearColumns();
    const quarterColumns = renderQuarterColumns();
    const monthColumns = renderMonthColumns();

    return yearColumns
      .map((col) => {
        const year = col.key;

        const relatedQuarterColumns = quarterColumns.filter((qCol) =>
          qCol.key.startsWith(`${year}-`)
        );

        const monthColumnsForYear = relatedQuarterColumns.flatMap((qCol) => {
          const quarter = qCol.key.split("-")[1];
          return monthColumns.filter((mCol) =>
            mCol.key.startsWith(`${year}-${quarter}-`)
          );
        });

        return [
          col,
          ...relatedQuarterColumns
            .map((qCol) => {
              const relatedMonthColumns = monthColumns.filter((mCol) =>
                mCol.key.startsWith(qCol.key)
              );
              return [qCol, ...relatedMonthColumns];
            })
            .flat(),
          ...monthColumnsForYear,
        ];
      })
      .flat();
  };

  const rowExpansionTemplate = ({ details }) => (
    <DataTable
      value={details}
      className="hide-header "
      tableStyle={{
        minWidth: "120px",
        width: "auto",
      }}
    >
      <Column />
      <Column
        field="description"
        header={false}
        style={{
          minWidth: "160px",
        }}
      />
      {getColumnComponents()}
    </DataTable>
  );

  return (
    <div className="card m-4 relative overflow-x-auto">
      <DataTable
        tableStyle={{
          minWidth: "120px",
          width: "auto",
        }}
        value={groupedData}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        dataKey="label"
      >
        <Column expander style={{ width: "3rem" }} />
        <Column
          field="label"
          header="Cost Type"
          style={{
            minWidth: "145px",

            textAlign: "start",
            fontSize: "17px",
          }}
        />
        {getTotalColumnComponents()}
      </DataTable>
    </div>
  );
};
export async function getServerSideProps() {
  try {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;
    const formId = process.env.NEXT_PUBLIC_FORM_ID;

    const response = await fetch(
      `${baseURL}/form/2/${accountId}/${formId}/list?page_size=100`,
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
export default Table;
