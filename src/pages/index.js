import React from "react";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import moment from "moment";

export default function Home({ result }) {
  const getDateAfter60Days = () => {
    const currentDate = moment();
    const futureDate = currentDate.add(60, "days");

    return futureDate.format("YYYY-MM-DD");
  };

  const customizedContent = (item) => {
    const {
      _id,
      Work_Order_Number,
      Locomotive_Number,
      Forecast_Date,
      Job_Plan_Description,
    } = item;

    const futureDate = getDateAfter60Days();
    const isForecastDateWithin60Days = moment(
      Forecast_Date,
      "YYYY-MM-DD"
    ).isBefore(moment(futureDate, "YYYY-MM-DD"));

    return (
      <>
        {Work_Order_Number ? (
          <Card
            key={_id}
            className={
              isForecastDateWithin60Days ? "yellow-card" : "green-card"
            }
          >
            <div className="flex items-center justify-between">
              <Tag
                value={`# ${Work_Order_Number}`}
                className={`font-lato text-sm font-semibold ${
                  isForecastDateWithin60Days ? "bg-[#F9A400]" : "bg-[#0EBE20]"
                }`}
              />
              <Tag
                icon="pi pi-calendar"
                value={Forecast_Date}
                className={`rounded-r-none font-lato text-sm font-normal ${
                  isForecastDateWithin60Days ? "bg-[#666666]" : "bg-[#666666]"
                }`}
              />
            </div>
            <h3 className="font-lato text-2xl font-bold text-black">
              {Locomotive_Number}
            </h3>
            <p
              className="pr-4 text-[#6A6A6A] text-sm card-description"
              title={Job_Plan_Description}
            >
              {Job_Plan_Description}
            </p>
          </Card>
        ) : (
          <Card key={_id} className="simple-card">
            <div className="flex items-center justify-between">
              <h3 className="font-lato text-2xl font-bold text-black">
                {Locomotive_Number}
              </h3>
              <Tag
                icon="pi pi-calendar"
                value={Forecast_Date}
                className="rounded-r-none bg-[#015FDF]"
              />
            </div>
            <p
              className="pr-4 text-[#6A6A6A] text-sm card-description"
              title={Job_Plan_Description}
            >
              {Job_Plan_Description}
            </p>
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="timeline-container">
      <h2 className="font-lato text-5xl font-black text-[#252525]">
        Event Timeline{" "}
        <span className="font-lato text-5xl font-light text-[#252525]">
          2024
        </span>
      </h2>
      {/* <div className="w-[992px] flex gap-3 items-center justify-center mt-8">
        <IconField
          iconPosition="left"
          className="timeline-search-container w-full"
        >
          <InputIcon className="pi pi-search" />
          <InputText
            v-model="value1"
            placeholder="Search by Forecasted number / status / PM type / Priority / UOM "
            className="timeline-search w-full"
          />
        </IconField>
        <Button
          label="Filters"
          icon="pi pi-filter"
          iconPos="left"
          className="w-28"
        />
      </div> */}
      <div className="data-timeline-container">
        <Timeline
          value={result?.Data}
          content={customizedContent}
          align="alternate"
          layout="horizontal"
          opposite={<span>&nbsp;</span>}
          className="data-timeline"
        />
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const response = await fetch(
      "https://development-diginergynfr.kissflow.eu/form/2/Ac86Ze9Cpd_e/Dummy_Fleet_Data_A00/list",
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
