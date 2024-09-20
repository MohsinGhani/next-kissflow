import React, { useEffect, useState } from "react";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";
import moment from "moment";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { CSVLink, CSVDownload } from "react-csv";

export default function Home({ result }) {
  const [selectedLocoNumbers, setSelectedLocoNumbers] = useState([]);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);
  const [tableView, setTableView] = useState(false);
  const [dates, setDates] = useState(null);

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
    const endDate = getDateAfterDays(months * 30); // Rough estimate for days in a month
    setDates([startDate, endDate]);
  };

  const customizedContent = (item) => {
    const { _id, WO_Number, Next_Due_Date, PM_Description, Loco_Description } =
      item;
    const futureDate = getDateAfterDays(60);
    const currentDate = moment().startOf("day");
    const dueDate = moment(Next_Due_Date, "YYYY-MM-DD");

    const isForecastDateWithin60Days = dueDate.isBetween(
      currentDate,
      futureDate,
      "days",
      "[]"
    );
    const isDueDateInPast = dueDate.isBefore(currentDate);

    const daysDifference = dueDate.diff(currentDate, "days");

    let daysText = "";

    if (daysDifference > 0) {
      if (daysDifference > 365) {
        const years = Math.floor(daysDifference / 365);
        daysText = `In ${years} year${years > 1 ? "s" : ""}`;
      } else if (daysDifference > 30) {
        const months = Math.floor(daysDifference / 30);
        daysText = `In ${months} month${months > 1 ? "s" : ""}`;
      } else if (daysDifference > 7) {
        const weeks = Math.floor(daysDifference / 7);
        daysText = `In ${weeks} week${weeks > 1 ? "s" : ""}`;
      } else {
        const days = Math.floor(daysDifference / 7);
        daysText = `In ${daysDifference} day${days !== -1 ? "s" : ""}`;
      }
    } else {
      const pastDaysDifference = Math.abs(daysDifference);
      if (pastDaysDifference > 365) {
        const years = Math.floor(pastDaysDifference / 365);
        daysText = `${years} year${years > 1 ? "s" : ""} ago`;
      } else if (pastDaysDifference > 30) {
        const months = Math.floor(pastDaysDifference / 30);
        daysText = `${months} month${months > 1 ? "s" : ""} ago`;
      } else if (pastDaysDifference > 7) {
        const weeks = Math.floor(pastDaysDifference / 7);
        daysText = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
      } else {
        const days = Math.floor(daysDifference / 7);
        daysText = `${pastDaysDifference} day${days !== 1 ? "s" : ""} ago`;
      }
    }

    console.log("🚀 ~ daysText:", daysText);

    return (
      <>
        {WO_Number ? (
          <>
            <Card
              key={_id}
              className={`custom-card ${
                isDueDateInPast
                  ? "green-card"
                  : isForecastDateWithin60Days
                  ? "yellow-card"
                  : "green-card"
              }`}
            >
              <h3
                className="card-title font-lato text-xl font-bold text-black"
                title={Loco_Description}
              >
                {Loco_Description}
              </h3>
              {daysDifference !== 0 && (
                <p className={`text-center font-lato text-sm text-textMedium`}>
                  {daysText}
                </p>
              )}
              <Tag
                value={`# ${WO_Number}`}
                className={`font-lato text-sm font-semibold ${
                  isDueDateInPast
                    ? "bg-secondary"
                    : isForecastDateWithin60Days
                    ? "bg-accent"
                    : "bg-secondary"
                }`}
              />
              <Tag
                icon="pi pi-calendar"
                value={Next_Due_Date}
                className={`font-lato text-sm font-normal ${
                  isForecastDateWithin60Days
                    ? "bg-MediumBackground"
                    : "bg-MediumBackground"
                }`}
              />
              <p className="card-description text-xs" title={PM_Description}>
                {PM_Description}
              </p>
            </Card>
          </>
        ) : (
          <>
            <Card key={_id} className="simple-card">
              <h3
                className="card-title font-lato text-xl font-bold text-black"
                title={Loco_Description}
              >
                {Loco_Description}
              </h3>
              {daysDifference !== 0 && (
                <p className="text-center font-lato text-sm text-textMedium">
                  {daysText}
                </p>
              )}
              <Tag
                icon="pi pi-calendar"
                value={Next_Due_Date}
                className="bg-primary"
              />
              <p className="card-description text-xs" title={PM_Description}>
                {PM_Description}
              </p>
            </Card>
          </>
        )}
      </>
    );
  };

  const customizedMarker = (item) => {
    const currentDate = moment().startOf("day");
    const forecastedDate = moment(item?.Next_Due_Date).startOf("day");

    if (currentDate.isSame(forecastedDate, "day")) {
      return (
        <span className="w-full flex items-center justify-center  custom-marker z-10">
          <Tag icon="pi pi-calendar" className="bg-primary">
            Today
          </Tag>
        </span>
      );
    } else {
      return (
        <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#217efd] bg-white custom-marker" />
      );
    }
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
  const handleData = (rowData, field) => rowData[field] || "-";

  return (
    <div className="timeline-container pt-8">
      <div className="w-full fixed flex flex-col justify-center items-center gap-4">
        <div className="w-full flex justify-center items-start gap-4">
          <div className="w-1/4 ">
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
      </div>

      <div className="data-timeline-container">
        {tableView ? (
          <div className="w-4/6 ">
            <div className="w-full gap-4 justify-end flex my-2 ">
              <div>
                <Button
                  onClick={() => setTableView((prev) => !prev)}
                  className="bg-primary border-primary px-4 py-[8px] text-sm flex-1 text-white rounded-md"
                >
                  Switch to Timeline View
                </Button>
              </div>
              <CSVLink
                data={filteredData}
                className="bg-primary border-primary px-4 py-[8px] text-sm text-white rounded-md"
              >
                Download Table
              </CSVLink>
            </div>
            <DataTable
              style={{ border: "1px solid #e6e6e6" }}
              showGridlines
              value={filteredData}
              paginatorLeft
              paginator
              rows={10}
              rowsPerPageOptions={[10, 30, 40, 50]}
              tableStyle={{ minWidth: "50rem", borderRadius: "50px" }}
            >
              {[
                "Loco_Description",
                "Next_Due_Date",
                "WO_Number",
                "Description",
              ].map((field) => (
                <Column
                  key={field}
                  field={field}
                  header={field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                  body={(rowData) => handleData(rowData, field)}
                  className={field !== "Description" && "w-64"}
                />
              ))}
            </DataTable>
          </div>
        ) : (
          <div className="max-w-full">
            <div className="text-end w-10/12 ">
              <Button
                onClick={() => setTableView((prev) => !prev)}
                className="bg-primary border-primary px-5 py-[8px] text-sm flex-1 text-white rounded-md"
              >
                Switch to Table View
              </Button>
            </div>
            <Timeline
              value={filteredData}
              content={customizedContent}
              align="alternate"
              layout="horizontal"
              opposite={<span>&nbsp;</span>}
              className="data-timeline"
              marker={customizedMarker}
            />
          </div>
        )}
      </div>
    </div>
  );
}

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
