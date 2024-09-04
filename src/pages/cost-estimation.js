import React, { useEffect, useState } from "react";
import moment from "moment";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DAYS_IN_MONTH = 30;
const MAX_DESC_LENGTH = 150;

const formatDescription = (desc) => {
  return desc?.length > MAX_DESC_LENGTH
    ? desc?.substring(0, MAX_DESC_LENGTH) + "..."
    : desc;
};

const Index = ({ result }) => {
  const [selectedLocoNumbers, setSelectedLocoNumbers] = useState([]);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);
  const [dates, setDates] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    if (result?.Data) {
      const uniqueLocoNumbers = [
        ...new Set(
          result.Data.map((item) => item?.Loco_Description).filter(Boolean)
        ),
      ];
      console.log(uniqueLocoNumbers);
      setLocomotiveNumbers(uniqueLocoNumbers);
      setSelectedLocoNumbers(uniqueLocoNumbers);
    }
  }, [result]);

  const getDateAfterDays = (days) => moment().add(days, "days").toDate();

  const handleNextMonthsFilter = (months) => {
    const startDate = moment().startOf("day").toDate();
    const endDate = getDateAfterDays(months * DAYS_IN_MONTH);
    setDates([startDate, endDate]);
  };

  const renderCell = (rowData, field) => rowData[field] || "-";

  const filteredData = (result?.Data || [])
    .filter((item) => {
      const matchesLocoNumber =
        !selectedLocoNumbers.length ||
        selectedLocoNumbers.includes(item?.Loco_Description);
      const matchesDateRange = dates
        ? moment(item.Next_Due_Date).isBetween(
            moment(dates[0]).startOf("day"),
            moment(dates[1]).endOf("day"),
            null,
            "[]"
          )
        : true;
      return matchesLocoNumber && matchesDateRange;
    })
    .sort((a, b) => moment(a.Next_Due_Date).diff(moment(b.Next_Due_Date)));

  const columns = [
    { field: "Loco_Description", header: "Loco Description", width: "12%" },
    { field: "PM_Description", header: "PM Description", width: "30%" },
    {
      field: "Estimated_Labor_Cost",
      header: "Estimated Labor Cost",
      width: "12%",
    },
    {
      field: "Estimated_Tool_Cost",
      header: "Estimated Tool Cost",
      width: "12%",
    },
    {
      field: "Estimated_Service_Cost",
      header: "Estimated Service Cost",
      width: "12%",
    },
    {
      field: "Estimated_Item_Cost",
      header: "Estimated Item Cost",
      width: "12%",
    },
    { field: "Total_Budget", header: "Total Budget", width: "12%" },
  ];

  const customPaginatorTemplate = {
    layout:
      "RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink",
    RowsPerPageDropdown: (options) => (
      <Dropdown
        placeholder="Rows per page"
        value={options.value}
        options={options.options}
        onChange={options.onChange}
      />
    ),
  };

  const renderDescCell = (rowData) => {
    const desc = rowData["PM_Description"];
    const rowId = rowData["_id"];
    const truncatedDesc = formatDescription(desc);

    return (
      <p
        onClick={() =>
          setExpandedRowId((prevId) => (prevId === rowId ? null : rowId))
        }
      >
        {expandedRowId === rowId || desc?.length <= MAX_DESC_LENGTH
          ? desc
          : truncatedDesc}
      </p>
    );
  };

  return (
    <div className="pt-8 mt-4">
      <div className="w-full flex justify-center items-start gap-4">
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
              className="w-full"
              display="chip"
            />
            <label htmlFor="ms-loco">Locomotive Numbers</label>
          </FloatLabel>
        </div>
        <div className="w-1/4 flex flex-col gap-4 justify-center">
          <FloatLabel>
            <Calendar
              value={dates}
              onChange={(e) => setDates(e.value)}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
              view="month"
              dateFormat="MM/yy"
              placeholder="Month Range"
              showButtonBar
              className="w-full"
            />
            <label htmlFor="ms-month">Month Range</label>
          </FloatLabel>
          <div className="w-full flex justify-center items-center gap-4">
            {[3, 6, 12].map((months) => (
              <Button
                key={months}
                label={`Next ${months} Months`}
                onClick={() => handleNextMonthsFilter(months)}
                className="bg-primary border-primary px-2 py-[6px] text-sm flex-1"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 p-10">
        <DataTable
          value={filteredData}
          paginator
          rows={7}
          showGridlines
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          paginatorTemplate={customPaginatorTemplate}
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          tableStyle={{ minWidth: "50rem" }}
          paginatorLeft={<Button type="button" icon="pi pi-refresh" text />}
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              style={{ width: col.width }}
              body={
                col.field === "PM_Description"
                  ? renderDescCell
                  : (rowData) => renderCell(rowData, col.field)
              }
            />
          ))}
        </DataTable>
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

export default Index;
