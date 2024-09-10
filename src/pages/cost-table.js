import React, { useState, useMemo, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { MultiSelect } from "primereact/multiselect";
import { FloatLabel } from "primereact/floatlabel";
import { Sidebar } from "primereact/sidebar";
import { Card } from "primereact/card";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { useRouter } from "next/router";

const useQuarterMapping = () =>
  useMemo(
    () => ({
      Q1: ["January", "February", "March"],
      Q2: ["April", "May", "June"],
      Q3: ["July", "August", "September"],
      Q4: ["October", "November", "December"],
    }),
    []
  );
const groupCosts = (data, costKey, quarterMapping) => {
  return data.reduce((acc, item) => {
    const description = item.Loco_Description || "Unknown";
    const date = item.Next_Due_Date;
    const costValue = item[costKey];

    if (date && typeof date === "string") {
      const [year, month] = date.split("-");
      const monthName = new Date(`${year}-${month}-01`).toLocaleString(
        "default",
        { month: "long" }
      );
      const quarter = Object.keys(quarterMapping).find((q) =>
        quarterMapping[q].includes(monthName)
      );
      const value =
        parseFloat(costValue?.replace(" EUR", "").replace(",", ".")) || 0;

      acc[description] = acc[description] || { description, years: {} };
      acc[description].years[year] = acc[description].years[year] || {
        total: 0,
        quarters: {},
      };
      acc[description].years[year].quarters[quarter] = acc[description].years[
        year
      ].quarters[quarter] || { total: 0, months: {} };

      acc[description].years[year].total += value;
      acc[description].years[year].quarters[quarter].total += value;
      acc[description].years[year].quarters[quarter].months[monthName] =
        (acc[description].years[year].quarters[quarter].months[monthName] ||
          0) + value;
    }

    return acc;
  }, {});
};

const createGroupedData = (result, quarterMapping, filteredData) => {
  const laborCost = groupCosts(
    filteredData,
    "Estimated_Labor_Cost",
    quarterMapping
  );
  const toolCost = groupCosts(
    filteredData,
    "Estimated_Tool_Cost",
    quarterMapping
  );
  const serviceCost = groupCosts(
    filteredData,
    "Estimated_Service_Cost",
    quarterMapping
  );
  const itemCost = groupCosts(
    filteredData,
    "Estimated_Item_Cost",
    quarterMapping
  );

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

              Object.keys(
                costGroup[description].years[year].quarters[quarter].months
              ).forEach((month) => {
                if (
                  !totalCosts[description].years[year].quarters[quarter].months[
                    month
                  ]
                ) {
                  totalCosts[description].years[year].quarters[quarter].months[
                    month
                  ] = 0;
                }
                totalCosts[description].years[year].quarters[quarter].months[
                  month
                ] +=
                  costGroup[description].years[year].quarters[quarter].months[
                    month
                  ];
              });
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
  useMemo(
    () =>
      [
        ...new Set(
          groupedData.flatMap(({ details }) =>
            details.flatMap(({ years }) => Object.keys(years))
          )
        ),
      ].sort(),
    [groupedData]
  );

const Table = ({ result }) => {
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandedQuarters, setExpandedQuarters] = useState(new Set());
  const [selectedLocoNumbers, setSelectedLocoNumbers] = useState([]);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);
  const [sidebarFilter, setSidebarFilter] = useState([]);
  const [selectedLocoDescription, setSelectedLocoDescription] = useState("");
  const [visibleRight, setVisibleRight] = useState(false);
  const [sidebarData, setSideBarData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const quarterMapping = useQuarterMapping();
  const filteredData = (result?.Data || []).filter((item) => {
    const matchesLocoNumber =
      !selectedLocoNumbers?.length ||
      selectedLocoNumbers.includes(item?.Loco_Description);
    return matchesLocoNumber;
  });
  const router = useRouter();
  const { asPath } = router;

  const groupedData = useMemo(
    () => createGroupedData(result, quarterMapping, filteredData),
    [result, quarterMapping, filteredData]
  );
  const allYears = useAllYears(groupedData);

  useEffect(() => {
    if (result?.Data) {
      const uniqueLocoNumbers = [
        ...new Set(
          result.Data.map((item) => item?.Loco_Description).filter(
            (description) => description !== null && description !== undefined
          )
        ),
      ];

      setLocomotiveNumbers(uniqueLocoNumbers);
      setSelectedLocoNumbers(uniqueLocoNumbers);
    }
  }, []);

  const handleYearToggle = (year) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      newSet.has(year) ? newSet.delete(year) : newSet.add(year);
      return newSet;
    });
  };
  const renderTotalYearColumns = () =>
    allYears.map((year) => (
      <Column
        style={{ background: "#d3d3d3" }}
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
          return (
            <div
              className="cursor-pointer"
              onClick={() => getAllDatawithFilter(year)}
            >
              {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
            </div>
          );
        }}
        className="table-field-style"
      />
    ));
  const renderTotalQuarterColumns = () =>
    Array.from(expandedYears).flatMap((year) =>
      ["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
        <Column
          style={{ background: "#e4e4e4" }}
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
            return (
              <div onClick={() => getAllDatawithFilter(year, quarter)}>
                {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
              </div>
            );
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
          style={{ background: "#f2f2f2" }}
          key={`${year}-${quarter}-${month}`}
          field={`${year}-${quarter}-${month}`}
          header={month}
          body={({ details }) => {
            if (!details || !Array.isArray(details)) {
              return "0 EUR";
            }

            const monthlyCost = details.reduce((acc, { years }) => {
              if (
                years[year] &&
                years[year].quarters[quarter] &&
                years[year].quarters[quarter].months[month]
              ) {
                return acc + years[year].quarters[quarter].months[month];
              }
              return acc;
            }, 0);

            return (
              <div onClick={() => getAllDatawithFilter(year, quarter, month)}>
                {monthlyCost > 0 ? `${monthlyCost.toFixed(2)} EUR` : "0 EUR"}
              </div>
            );
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
  const [allDataFilter, setAllDataFilter] = useState(false);
  const getAllDatawithFilter = (year, quarter, month) => {
    setAllDataFilter(true);
    const yearNumber = Number(year);

    const dataset = filteredData.filter((item) => {
      const dueDate = new Date(item.Next_Due_Date);
      const dueDateYear = dueDate.getFullYear();
      const itemMonth = dueDate.toLocaleString("default", { month: "long" });

      const matchesYear = !year || dueDateYear === yearNumber;
      const matchesQuarter =
        !quarter || quarterMapping[quarter]?.includes(itemMonth);
      const matchesMonth = !month || itemMonth === month;
      const hasEstimatedLaborCost = item.Estimated_Labor_Cost != null;

      return (
        matchesYear && matchesQuarter && matchesMonth && hasEstimatedLaborCost
      );
    });

    const dataByDescription = dataset.reduce((acc, item) => {
      const description = item.Loco_Description || "No Description";
      if (!acc[description]) {
        acc[description] = [];
      }
      acc[description].push(item);
      return acc;
    }, {});

    setSelectedLocoDescription([
      `Cost In ${year}${quarter ? ` - ${quarter}` : ""}${
        month ? ` - ${month}` : ""
      }`,
    ]);
    setSideBarData(Object.values(dataByDescription).flat());
    setVisibleRight(true);
  };

  const getDataWithFilter = (year, description, quarter, month) => {
    setAllDataFilter(false);
    const yearNumber = Number(year);
    const trimmedDescription = description.trim().toLowerCase();
    const queryString = asPath.split("?")[1];

    const dataset = filteredData.filter((item) => {
      const dueDate = new Date(item.Next_Due_Date);
      const dueDateYear = dueDate.getFullYear();
      const itemMonth = dueDate.toLocaleString("default", { month: "long" });

      return (
        (!year || dueDateYear === yearNumber) &&
        (!description ||
          item.Loco_Description.trim().toLowerCase() === trimmedDescription) &&
        (!queryString || item[queryString]?.trim()) &&
        (!month || itemMonth === month) &&
        (!quarter || quarterMapping[quarter]?.includes(itemMonth))
      );
    });

    setSearchTerm("");
    setSelectedLocoDescription([
      `Cost In ${year}${quarter ? ` - ${quarter}` : ""}${
        month ? ` - ${month}` : ""
      }`,
    ]);
    setSideBarData(dataset);
    setVisibleRight(true);
  };

  const renderYearColumns = () =>
    allYears.map((year) => (
      <Column
        style={{ background: "#d3d3d3" }}
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
        body={({ years, description }) => {
          const total = years[year]?.total || 0;

          return (
            <div
              className="cursor-pointer"
              onClick={() => getDataWithFilter(year, description)}
            >
              {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
            </div>
          );
        }}
        className="table-field-style"
      />
    ));
  const renderMonthColumns = () =>
    Array.from(expandedQuarters).flatMap((key) => {
      const [year, quarter] = key.split("-");
      return quarterMapping[quarter].map((month) => (
        <Column
          style={{ background: "#f2f2f2" }}
          key={`${year}-${quarter}-${month}`}
          field={`${year}-${quarter}-${month}`}
          header={month}
          body={({ years, description }) => {
            if (!years || !years[year] || !years[year].quarters[quarter]) {
              return "0 EUR";
            }
            const monthlyCost =
              years[year].quarters[quarter].months[month] || 0;

            return (
              <div
                className="cursor-pointer"
                onClick={() =>
                  getDataWithFilter(year, description, quarter, month)
                }
              >
                {monthlyCost > 0 ? `${monthlyCost.toFixed(2)} EUR` : "0 EUR"}
              </div>
            );
          }}
          className="table-field-style"
        />
      ));
    });

  const renderQuarterColumns = () =>
    Array.from(expandedYears).flatMap((year) =>
      ["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
        <Column
          style={{ background: "#e4e4e4" }}
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
          body={({ years, description }) => {
            if (!years || !years[year] || !years[year].quarters) {
              return "0 EUR";
            }
            const total = years[year].quarters[quarter]?.total || 0;

            return (
              <div
                className="cursor-pointer "
                onClick={() => getDataWithFilter(year, description, quarter)}
              >
                {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
              </div>
            );
          }}
          className="table-field-style"
        />
      ))
    );
  const getColumnComponents = () => {
    const yearColumns = renderYearColumns();
    const quarterColumns = renderQuarterColumns();
    const monthColumns = renderMonthColumns();

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
  const rowExpansionTemplate = ({ details }) => {
    const handleDescriptionClick = (description) => {
      setSelectedLocoDescription(description);

      const trimmedDescription = description.trim().toLowerCase();
      const queryString = asPath.split("?")[1];

      const filteredDataset = filteredData
        .filter(
          ({ Loco_Description }) =>
            Loco_Description.trim().toLowerCase() === trimmedDescription
        )
        .filter((data) => data[queryString]?.trim());

      setSideBarData(filteredDataset);
      setVisibleRight(true);
    };

    return (
      <DataTable value={details} className="hide-header">
        <Column />
        <Column
          field="description"
          header={false}
          style={{
            minWidth: "160px",
            cursor: "pointer",
          }}
          body={({ description }) => (
            <div onClick={() => handleDescriptionClick(description, details)}>
              {description}
            </div>
          )}
        />
        {getColumnComponents()}
      </DataTable>
    );
  };

  const handleRowExpansion = (e) => {
    const costTypes = Object.keys(e.data || {}).filter(
      (key) => e.data[key] === true
    );
    const latestCostType = costTypes.pop();
    if (latestCostType) {
      router.push(
        `/cost-table?Estimated_${encodeURIComponent(
          latestCostType.replace(/\s+/g, "_")
        )}`
      );
    }
  };

  useEffect(() => {
    if (searchTerm && sidebarData) {
      const filterData = sidebarData.filter((item) =>
        item.PM_Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSidebarFilter(filterData);
    }
  }, [searchTerm]);
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };
  const dataToDisplay = searchTerm.length > 0 ? sidebarFilter : sidebarData;

  const groupedDataAll = dataToDisplay.reduce((acc, item) => {
    const description = item.Loco_Description || "No Description";
    if (!acc.has(description)) {
      acc.set(description, []);
    }
    acc.get(description).push(item);
    return acc;
  }, new Map());

  const renderGroupedData = () =>
    Array.from(groupedDataAll.entries()).map(([description, items]) => (
      <div key={description}>
        <h2 className="text-xl font-bold my-5">{description}</h2>
        {items.map((data) => (
          <Card
            className="rounded-md mt-4 border border-gray-200"
            key={data.id}
          >
            <h3 className="text-xl font-medium mb-1 mt-0">
              {formatDate(data.Next_Due_Date)}
            </h3>
            <p className="text-base font-normal">{data.PM_Description}</p>
          </Card>
        ))}
      </div>
    ));

  return (
    <div className="p-8">
      <div className="w-full flex justify-center items-start gap-4 mb-4">
        <div className="w-1/4">
          <FloatLabel>
            <MultiSelect
              value={selectedLocoNumbers}
              onChange={(e) => setSelectedLocoNumbers(e.value)}
              options={locomotiveNumbers.map((number) => ({
                label: number,
                value: number,
              }))}
              selectAllLabel="All"
              placeholder="Select Locomotive Numbers"
              showClear
              className="w-full p-2"
              display="chip"
            />
            <label htmlFor="ms-loco">Locomotive Numbers</label>
          </FloatLabel>
        </div>
      </div>

      <div className="card">
        <Sidebar
          visible={visibleRight}
          position="right"
          onHide={() => setVisibleRight(false)}
        >
          <h2 className="text-2xl mr-2 font-bold mb-4">
            {selectedLocoDescription}
          </h2>
          <IconField iconPosition="left" className="my-4">
            <InputIcon className="pi pi-search" />
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ..."
              className="w-full rounded-md"
            />
          </IconField>

          <div>
            {dataToDisplay.length > 0 ? (
              allDataFilter ? (
                renderGroupedData()
              ) : (
                dataToDisplay.map((data) => (
                  <Card
                    className="rounded-md mt-4 border border-gray-200"
                    key={data.id}
                  >
                    <h3 className="text-xl font-medium mb-1 mt-0">
                      {formatDate(data.Next_Due_Date)}
                    </h3>
                    <p className="text-base font-normal">
                      {data.PM_Description}
                    </p>
                  </Card>
                ))
              )
            ) : (
              <p className="text-lg font-medium">Nothing to Show!</p>
            )}
          </div>
        </Sidebar>
      </div>

      <div>
        <DataTable
          tableStyle={{ minWidth: "120px", width: "auto" }}
          value={groupedData}
          expandedRows={expandedRows}
          onRowToggle={(e) => {
            setExpandedRows(e.data);
            handleRowExpansion(e);
          }}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="label"
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            field="label"
            header="Cost Type"
            style={{ minWidth: "145px", textAlign: "start", fontSize: "17px" }}
          />
          {getTotalColumnComponents()}
        </DataTable>
      </div>
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
