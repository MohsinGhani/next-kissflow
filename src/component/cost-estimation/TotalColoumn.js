import React from "react";
import { Column } from "primereact/column";
import CustomButton from "../CustomButton";

// TotalColumn Component
const TotalColumn = ({ key, field, header, body, style }) => (
  <Column
    key={key}
    field={field}
    header={header}
    body={body}
    style={style}
    className="table-field-style"
  />
);

// Render Year Columns
export const renderYearColumns = (
  allYears,
  handleYearToggle,
  getDataWithFilter
) =>
  allYears?.map((year) => (
    <TotalColumn
      key={year}
      field={year}
      header={
        <CustomButton
          className="border-0"
          title={year}
          onClick={() => handleYearToggle(year)}
        />
      }
      body={(result, { rowIndex }) => {
        const total = result?.years[year]?.total || 0;
        return (
          <div
            className="cursor-pointer"
            onClick={() => getDataWithFilter(year, result?.description)}
          >
            {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
          </div>
        );
      }}
      style={{ background: expandedYears.has(year) ? "#d3d3d3" : "white" }}
    />
  ));

// Render Quarter Columns
export const renderTotalQuarterColumns = (
  expandedYears, // Ensure expandedYears is passed in
  handleQuarterToggle,
  getDataWithFilter
) => {
  // Check if expandedYears is defined
  return Array.from(expandedYears || []).flatMap((year) =>
    ["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
      <TotalColumn
        key={`${year}-${quarter}`}
        field={`${year}-${quarter}`}
        header={
          <div>
            <CustomButton
              className="border-0 "
              title={quarter}
              onClick={() => handleQuarterToggle(year, quarter)}
            />
          </div>
        }
        body={(result, { rowIndex }) => {
          if (!Array.isArray(result?.details)) {
            return <div>0 EUR</div>;
          }
          const total = result?.details.reduce(
            (acc, { years }) =>
              acc + (years[year]?.quarters[quarter]?.total || 0),
            0
          );

          return (
            <div
              className="cursor-pointer"
              onClick={() => getDataWithFilter(year, quarter, null, rowIndex)}
            >
              {total > 0 ? `${total.toFixed(2)} EUR` : "0 EUR"}
            </div>
          );
        }}
        style={{ background: "#e4e4e4" }} // Added style for visual distinction
        className="table-field-style"
      />
    ))
  );
};

// Render Month Columns
export const renderMonthColumns = (
  expandedQuarters,
  quarterMapping,
  getDataWithFilter
) =>
  Array.from(expandedQuarters).flatMap((key) => {
    const [year, quarter] = key.split("-");
    return quarterMapping[quarter]?.map((month) => (
      <TotalColumn
        key={`${year}-${quarter}-${month}`}
        field={`${year}-${quarter}-${month}`}
        header={month}
        body={({ years, description }) => {
          if (!years || !years[year] || !years[year].quarters[quarter]) {
            return "0 EUR";
          }
          const monthlyCost = years[year].quarters[quarter].months[month] || 0;
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
        style={{ background: "#f2f2f2" }}
      />
    ));
  });

// Main function to get Column Components
