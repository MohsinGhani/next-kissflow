import React, { useEffect, useState } from "react";
import moment from "moment";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import { MultiSelect } from "primereact/multiselect";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";

export default function Index({ result }) {
  const [selectedLocoNumbers, setSelectedLocoNumbers] = useState([]);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);
  const [dates, setDates] = useState(null);

  const paginatorLeft = <Button type="button" icon="pi pi-refresh" text />;

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
  }, [result]);

  const getDateAfterDays = (days) => {
    return moment().add(days, "days").toDate();
  };

  const handleNextMonthsFilter = (months) => {
    const startDate = moment().startOf("day").toDate();
    const endDate = getDateAfterDays(months * 30);
    setDates([startDate, endDate]);
  };

  const renderCell = (rowData, field) => {
    const value = rowData[field];
    return value ? value : "-";
  };

  const renderDescCell = (rowData) => {
    const desc = rowData["PM_Description"];

    if (!desc) {
      return null;
    }

    const MAX_LENGTH = 150;
    const truncatedDesc =
      desc.length > MAX_LENGTH ? desc.substring(0, MAX_LENGTH) + "..." : desc;

    return (
      <>
        <Tooltip
          target=".logo"
          mouseTrack
          mouseTrackLeft={10}
          style={{ width: 400 }}
        />

        {desc.length < MAX_LENGTH ? (
          <p>{desc}</p>
        ) : (
          <p className="logo" data-pr-tooltip={desc} height="80px">
            {" "}
            {truncatedDesc}
          </p>
        )}
      </>
    );
  };

  const filteredData = (result?.Data || [])
    .filter((item) => {
      const matchesLocoNumber =
        !selectedLocoNumbers?.length ||
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
    .sort((a, b) => {
      const dateA = moment(a.Next_Due_Date);
      const dateB = moment(b.Next_Due_Date);

      return dateA.isAfter(dateB) ? 1 : dateA.isBefore(dateB) ? -1 : 0;
    });
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
            <Button
              label="Next 3 Months"
              onClick={() => handleNextMonthsFilter(3)}
              className="bg-[#015FDF] border-[#015FDF] px-[8px] py-[6px] text-sm flex-1"
            />
            <Button
              label="Next 6 Months"
              onClick={() => handleNextMonthsFilter(6)}
              className="bg-[#015FDF] border-[#015FDF] px-[8px] py-[6px] text-sm flex-1"
            />
            <Button
              label="Next 12 Months"
              onClick={() => handleNextMonthsFilter(12)}
              className="bg-[#015FDF] border-[#015FDF] px-[8px] py-[6px] text-sm flex-1"
            />
          </div>
        </div>
      </div>
      <div className="mt-10 p-10">
        <DataTable
          value={filteredData}
          paginator
          rows={7}
          showGridlines
          rowsPerPageOptions={[5, 10, 25, 50]}
          tableStyle={{ minWidth: "50rem" }}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          paginatorLeft={paginatorLeft}
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
}

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
