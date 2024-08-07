import React from "react";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";

export default function Home({ result }) {
  const customizedContent = (item) => {
    return (
      <Card title={item.User_Name} subTitle={item.Email_1}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore
          sed consequuntur.
        </p>
      </Card>
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
      "https://development-diginergynfr.kissflow.eu/form/2/Ac86Ze9Cpd_e/Test_2_A00/list",
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
