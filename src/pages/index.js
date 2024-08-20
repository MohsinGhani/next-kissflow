import React, { useEffect, useState } from "react";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import moment from "moment";

export default function Home({ result }) {
  const [selectedLocoNumber, setSelectedLocoNumber] = useState(null);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);

  useEffect(() => {
    if (result?.Data) {
      const uniqueLocoNumbers = [
        ...new Set(result.Data.map((item) => item.Locomotive_Number)),
      ].map((number) => number);

      setLocomotiveNumbers(uniqueLocoNumbers);
    }
  }, [result]);

  useEffect(() => {
    if (result?.Data?.length > 0) {
      setSelectedLocoNumber(result.Data[0].Locomotive_Number);
    }
  }, [result]);

  const getDateAfter60Days = () => {
    const currentDate = moment();
    const futureDate = currentDate.add(60, "days");

    return futureDate.format("YYYY-MM-DD");
  };

  const customizedContent = (item) => {
    const { _id, WO_Number, Next_Due_Date, PM_Description } = item;

    const futureDate = getDateAfter60Days();
    const isForecastDateWithin60Days = moment(
      Next_Due_Date,
      "YYYY-MM-DD"
    ).isBefore(moment(futureDate, "YYYY-MM-DD"));

    return (
      <>
        {WO_Number ? (
          <>
            <Card
              key={_id}
              className={`custom-card ${
                isForecastDateWithin60Days ? "yellow-card" : "green-card"
              }`}
            >
              <Tag
                value={`# ${WO_Number}`}
                className={`font-lato text-sm font-semibold ${
                  isForecastDateWithin60Days ? "bg-[#F9A400]" : "bg-[#0EBE20]"
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

  const filteredData = (result?.Data || [])?.filter(
    (item) => item.Locomotive_Number === selectedLocoNumber
  );

  return (
    <div className="timeline-container pt-4">
      <div className="w-full flex justify-center items-center fixed">
        <Dropdown
          value={selectedLocoNumber}
          onChange={(e) => setSelectedLocoNumber(e.value)}
          options={locomotiveNumbers}
          optionLabel="name"
          placeholder="Select Locomotive Number"
          className="w-1/4"
        />
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
      `${baseURL}/form/2/${accountId}/${formId}/list?page_size=50`,
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
