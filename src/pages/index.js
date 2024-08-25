import React, { useEffect, useState } from "react";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";
import moment from "moment";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";

export default function Home({ result }) {
  const [selectedLocoNumbers, setSelectedLocoNumbers] = useState([]);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);
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
              <h3 className="font-lato text-xl font-bold text-black">
                {Loco_Description}
              </h3>
              <Tag
                value={`# ${WO_Number}`}
                className={`font-lato text-sm font-semibold ${
                  isDueDateInPast
                    ? "bg-[#0EBE20]"
                    : isForecastDateWithin60Days
                    ? "bg-[#F9A400]"
                    : "bg-[#0EBE20]"
                }`}
              />
              <Tag
                icon="pi pi-calendar"
                value={Next_Due_Date}
                className={`font-lato text-sm font-normal ${
                  isForecastDateWithin60Days ? "bg-[#666666]" : "bg-[#666666]"
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
              <h3 className="font-lato text-xl font-bold text-black">
                {Loco_Description}
              </h3>
              <Tag
                icon="pi pi-calendar"
                value={Next_Due_Date}
                className="bg-[#015FDF]"
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

  return (
    <div className="timeline-container pt-8">
      <div className="w-full fixed flex flex-col justify-center items-center gap-4">
        <div className="w-full flex justify-center items-center gap-4">
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
          <div className="w-1/4">
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
          </div>
        </div>
        <div className="w-full flex justify-center items-center gap-4">
          <Button
            label="Next 3 Months"
            onClick={() => handleNextMonthsFilter(3)}
            className="bg-[#015FDF] border-[#015FDF]"
          />
          <Button
            label="Next 6 Months"
            onClick={() => handleNextMonthsFilter(6)}
            className="bg-[#015FDF] border-[#015FDF]"
          />
          <Button
            label="Next 12 Months"
            onClick={() => handleNextMonthsFilter(12)}
            className="bg-[#015FDF] border-[#015FDF]"
          />
        </div>
      </div>
      <div className="data-timeline-container">
        <div className="max-w-full">
          <Timeline
            value={filteredData}
            content={customizedContent}
            align="alternate"
            layout="horizontal"
            opposite={<span>&nbsp;</span>}
            className="data-timeline"
          />
        </div>
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
