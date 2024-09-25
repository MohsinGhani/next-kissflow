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
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
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

const createGroupedData = (
  result,
  quarterMapping,
  filteredData,
  handleEyeIconClick,
  graphData
) => {
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
      Object.entries(costGroup).forEach(([description, descriptionData]) => {
        totalCosts[description] = totalCosts[description] || {
          description,
          years: {},
        };

        Object.entries(descriptionData.years).forEach(([year, yearData]) => {
          const yearTotal = totalCosts[description].years[year] || {
            total: 0,
            quarters: {},
          };
          yearTotal.total += yearData.total;

          Object.entries(yearData.quarters).forEach(
            ([quarter, quarterData]) => {
              const quarterTotal = yearTotal.quarters[quarter] || {
                total: 0,
                months: {},
              };
              quarterTotal.total += quarterData.total;

              Object.entries(quarterData.months).forEach(
                ([month, monthValue]) => {
                  quarterTotal.months[month] =
                    (quarterTotal.months[month] || 0) + monthValue;
                }
              );

              yearTotal.quarters[quarter] = quarterTotal;
            }
          );

          totalCosts[description].years[year] = yearTotal;
        });
      });
    });

    return totalCosts;
  };

  const createGroup = (label, details) => {
    const graphExists = graphData.find((graph) => graph.label === label);

    return {
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          onClick={() => handleEyeIconClick(label, details)}
        >
          <span>{label}</span>
          <i
            className={`pi ${graphExists ? "pi-eye" : "pi-eye-slash"}`}
            style={{ fontSize: "1.2rem", cursor: "pointer" }}
          />
        </div>
      ),
      details: Object.values(details ?? {}),
    };
  };

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
  const [chartData, setChartData] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const quarterMapping = useQuarterMapping();
  const router = useRouter();
  const { asPath } = router;

  const filteredData = (result?.Data || []).filter(
    ({ Loco_Description }) =>
      !selectedLocoNumbers?.length ||
      selectedLocoNumbers.includes(Loco_Description)
  );

  const handleEyeIconClick = (label, details) => {
    const graphExists = graphData.find((graph) => graph.label === label);

    if (graphExists) {
      setGraphData((prevGraphs) =>
        prevGraphs.filter((graph) => graph.label !== label)
      );
    } else {
      setGraphData((prevGraphs) => [...prevGraphs, { details, label }]);
    }

    console.log(graphData);
  };

  const groupedData = useMemo(
    () =>
      createGroupedData(
        result,
        quarterMapping,
        filteredData,
        handleEyeIconClick,
        graphData
      ),
    [result, quarterMapping, filteredData, graphData]
  );

  const allYears = useAllYears(groupedData);

  useEffect(() => {
    const uniqueLocoNumbers = result?.Data
      ? [
          ...new Set(
            result.Data.map(({ Loco_Description }) => Loco_Description).filter(
              Boolean
            )
          ),
        ]
      : [];

    setLocomotiveNumbers(uniqueLocoNumbers);
    setSelectedLocoNumbers(uniqueLocoNumbers);
  }, []);

  useEffect(() => {
    if (searchTerm && sidebarData) {
      const filterData = sidebarData.dataset.filter((item) =>
        item.PM_Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSidebarFilter(filterData);
    }
  }, [searchTerm]);

  const handleYearToggle = (year) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      newSet.has(year) ? newSet.delete(year) : newSet.add(year);
      return newSet;
    });
  };

  const renderTotalYearColumns = () => {
    return allYears.map((year) => (
      <Column
        key={year}
        field={year}
        header={
          <button
            className="btn-quarter-toggle"
            onClick={() => handleYearToggle(year)}
          >
            {year}
          </button>
        }
        body={(result, { rowIndex }) => {
          const total =
            result?.details?.reduce(
              (acc, { years }) => acc + (years[year]?.total || 0),
              0
            ) || 0;
          return (
            <div
              className="cursor-pointer"
              onClick={() => getAllDatawithFilter(year, null, null, rowIndex)}
            >
              {total.toFixed(2)} EUR
            </div>
          );
        }}
        className="table-field-style"
        style={{
          background: expandedYears.has(year) ? "#d3d3d3" : "white",
        }}
      />
    ));
  };

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
          body={(result, { rowIndex }) => {
            if (!Array.isArray(result?.details)) {
              return <div>0 EUR</div>;
            }
            const total = result?.details?.reduce(
              (acc, { years }) =>
                acc + (years[year]?.quarters[quarter]?.total || 0),
              0
            );
            return (
              <div
                className="cursor-pointer"
                onClick={() =>
                  getAllDatawithFilter(year, quarter, null, rowIndex)
                }
              >
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
          body={(result, { rowIndex }) => {
            if (!result?.details || !Array.isArray(result?.details)) {
              return "0 EUR";
            }

            const monthlyCost = result?.details.reduce((acc, { years }) => {
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
              <div
                className="cursor-pointer"
                onClick={() =>
                  getAllDatawithFilter(year, quarter, month, rowIndex)
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
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const getAllDatawithFilter = (year, quarter, month, rowIndex) => {
    const groupedData = createGroupedData(
      filteredData,
      quarterMapping,
      filteredData
    );
    let costType = "";

    if (rowIndex >= 0 && rowIndex < groupedData.length) {
      costType = groupedData[rowIndex].label;
    }
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

    setSelectedLocoDescription([
      ` ${costType} In ${year}${quarter ? ` - ${quarter}` : ""}${
        month ? ` - ${month}` : ""
      }`,
    ]);
    setSideBarData({ dataset, costType: true });
    setVisibleRight(true);
  };

  const getDataWithFilter = (year, description, quarter, month) => {
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

    const heading = [
      description && description,
      year && ` for ${year}`,
      quarter && ` in ${quarter}`,
      month && ` during ${month}`,
    ]
      .filter(Boolean)
      .join(" ");

    setSearchTerm("");
    setSelectedLocoDescription(heading);
    setSideBarData({ dataset, costType: false });
    setVisibleRight(true);
  };

  const renderYearColumns = () =>
    allYears.map((year) => (
      <Column
        style={{ background: expandedYears.has(year) ? "#d3d3d3" : "white" }}
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
      ["Q1", "Q2", "Q3", "Q4"].map((quarter) => {
        const key = `${year}-${quarter}`;
        return (
          <Column
            key={key}
            field={key}
            header={
              <button
                className="btn-quarter-toggle"
                onClick={() => handleQuarterToggle(year, quarter)}
              >
                {quarter}
              </button>
            }
            body={({ years, description }) => {
              const total = years?.[year]?.quarters?.[quarter]?.total || 0;
              return (
                <div
                  className="cursor-pointer"
                  onClick={() => getDataWithFilter(year, description, quarter)}
                >
                  {total.toFixed(2)} EUR
                </div>
              );
            }}
            className="table-field-style"
            style={{ background: "#e4e4e4" }}
          />
        );
      })
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
      const trimmedDescription = description.trim().toLowerCase();
      const queryString = asPath.split("?")[1];

      const filteredDataset = filteredData
        .filter(
          ({ Loco_Description }) =>
            Loco_Description.trim().toLowerCase() === trimmedDescription
        )
        .filter((data) => data[queryString]?.trim());

      setSelectedLocoDescription(description);
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
            minWidth: "165px",
            cursor: "pointer",
          }}
          body={({ description }) => {
            return (
              <div onClick={() => handleDescriptionClick(description, details)}>
                {description}
              </div>
            );
          }}
        />
        {getColumnComponents()}
      </DataTable>
    );
  };

  const Chart = ({ data, dataKey, label }) => {
    return (
      <div className="my-4 w-full" style={{ height: "400px" }}>
        <h3 className="my-5 text-xl font-bold"> {label} :</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {" "}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tickFormatter={(year) => year} />
            <YAxis />
            <RechartsTooltip />
            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  useEffect(() => {
    const allChartData =
      Array.isArray(graphData) && graphData.length > 0
        ? graphData
            .map(({ details, label }) => {
              if (details) {
                const resultData = Object.entries(details).flatMap(
                  ([key, value]) =>
                    value.years
                      ? Object.entries(value.years).map(([year, yearData]) => ({
                          year,
                          total: yearData.total || 0,
                        }))
                      : []
                );

                return {
                  label,
                  data: resultData.filter((item) => item.year),
                };
              }
              return null;
            })
            .filter((item) => item !== null)
        : [];

    setChartData(allChartData);
  }, [graphData]);

  const handleRowExpansion = (e) => {
    const costTypes = Object.keys(e.data || {}).filter(
      (key) => e.data[key] === true
    );
    const latestCostType = costTypes.pop();
    if (latestCostType) {
      router.push(
        `/cost-estimation?Estimated_${encodeURIComponent(
          latestCostType.replace(/\s+/g, "_")
        )}`
      );
    }
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };
  const dataToDisplay =
    searchTerm.length > 0 ? sidebarFilter : sidebarData.dataset;

  const groupedDataAll = dataToDisplay?.reduce((acc, item) => {
    const description = item.Loco_Description || "No Description";
    if (!acc.has(description)) acc.set(description, []);
    acc.get(description).push(item);
    return acc;
  }, new Map());

  const renderGroupedData = () =>
    Array.from(groupedDataAll.entries()).map(([description, items]) => (
      <div key={description}>
        {sidebarData.costType && (
          <h2 className="text-xl font-bold my-5">{description}</h2>
        )}
        {items.map((data) => (
          <div
            className="rounded-xl mt-4 border-2 border-gray-200"
            key={data.id}
          >
            <div className="text-xl font-medium mt-0 border-b border-gray-200">
              <h3 className="p-3 flex items-center rounded-t-xl text-white bg-gray-500 text-base">
                <i className="pi pi-calendar text-lg mr-2"></i>
                {formatDate(data.Next_Due_Date)}
              </h3>
            </div>
            <p className="text-base font-normal p-3">{data.PM_Description}</p>
          </div>
        ))}
      </div>
    ));
  console.log(chartData, "chartData");
  console.log(graphData, "graphData");
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
            {dataToDisplay?.length ? (
              renderGroupedData()
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
          <Column expander style={{ width: "2rem" }} />
          <Column
            field="label"
            header="Cost Type"
            style={{ minWidth: "145px", textAlign: "start", fontSize: "16px" }}
          />
          {getTotalColumnComponents()}
        </DataTable>
      </div>

      {chartData.length > 0 && (
        <div className="grid grid-cols-2 my-3 p-3 gap-12 border border-gray-100 ">
          {chartData.map((graph, index) => (
            <Chart
              key={index}
              data={graph.data}
              dataKey="total"
              label={graph.label}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export async function getServerSideProps() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;
  const formId = process.env.NEXT_PUBLIC_FORM_ID;
  const pageSize = 100;
  let allData = [];
  let page = 1;

  try {
    while (true) {
      const response = await fetch(
        `${baseURL}/form/2/${accountId}/${formId}/list?page_number=${page}&page_size=${pageSize}`,
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

      if (result.Data && result.Data.length > 0) {
        allData = allData.concat(result.Data);
      } else {
        break;
      }

      page++;
    }

    return {
      props: { result: { Data: allData } },
    };
  } catch (error) {
    console.error("Failed to fetch KissFlow API data:", error);

    return {
      props: { result: { Data: [] } },
    };
  }
}

export default Table;
