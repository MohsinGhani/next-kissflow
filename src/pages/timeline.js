import React, { useEffect, useMemo, useState } from "react";
import { MultiSelect } from "primereact/multiselect";
import moment from "moment";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";
import { CSVLink } from "react-csv";
import DataTableComponent from "@/component/DataTable";
import CustomButton from "@/component/CustomButton";
import TimelineComponent from "@/component/timeline/Timeline";
import CustomizedContent from "@/component/timeline/CustomCardContent";

export default function Home({ result, serviceEventResult }) {
  const [selectedLocoNumbers, setSelectedLocoNumbers] = useState([]);
  const [locomotiveNumbers, setLocomotiveNumbers] = useState([]);
  const [tableView, setTableView] = useState(false);
  const [dates, setDates] = useState(null);

  useEffect(() => {
    if (result?.Data) {
      const uniqueLocoNumbers = [
        ...new Set(
          result.Data?.map((item) => item?.Loco_Description).filter(
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

  const filteredData = useMemo(() => {
    const combinedData = [
      ...(result?.Data || []),
      ...(serviceEventResult?.Data?.map((item) => ({
        ...item,
        _id: item?.Locomotive_Number?._id,
        Loco_Description: item?.Locomotive_Number?.Name,
        Next_Due_Date: item?.Plan_Start,
        PM_Description: item?.Event_Service,
        service: true,
      })) || []),
    ];

    return combinedData
      .filter((item) => {
        const matchesLocoNumber =
          !selectedLocoNumbers?.length ||
          selectedLocoNumbers.includes(item?.Loco_Description);

        const matchesDateRange = dates
          ? moment(item?.Next_Due_Date).isBetween(
              moment(dates[0]).startOf("day"),
              moment(dates[1]).endOf("day"),
              null,
              "[]"
            )
          : true;

        CustomizedContent(item);
        return matchesLocoNumber && matchesDateRange;
      })
      .sort((a, b) => {
        const dateA = moment(a?.Next_Due_Date);
        const dateB = moment(b?.Next_Due_Date);
        return dateA.diff(dateB);
      });
  }, [result?.Data, serviceEventResult?.Data, selectedLocoNumbers, dates]);

  const columns = [
    { field: "Loco_Description", header: "Locomotive" },
    { field: "Next_Due_Date", header: "Next Due Date" },
    { field: "WO_Number", header: "WO Number" },
    { field: "Description", header: "Description" },
  ];

  return (
    <div className="timeline-container pt-8">
      <div className="w-full fixed  flex flex-col justify-center items-center gap-4">
        <div className="w-full flex justify-center items-start gap-4">
          <div className="w-1/4 ">
            <FloatLabel>
              <MultiSelect
                value={selectedLocoNumbers}
                onChange={(e) => setSelectedLocoNumbers(e.value)}
                options={locomotiveNumbers?.map((number) => ({
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
              {[3, 6, 12]?.map((months) => (
                <div
                  key={months}
                  className="bg-primary text-white border-primary px-2 font-medium py-[6px]  flex-1 text-center rounded-md"
                >
                  <CustomButton
                    className="border-0 p-0 bg-transparent"
                    title={`Next ${months} Months`}
                    onClick={() => handleNextMonthsFilter(months)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full gap-4 justify-end flex my-6 mt-24  fixed pr-12 p-5">
        <div>
          <Button
            onClick={() => setTableView((prev) => !prev)}
            className="bg-primary border-primary px-4 py-[7px] text-sm flex-1 text-white rounded-md"
          >
            Switch to {tableView ? "Timeline View" : "Table view"}
          </Button>
        </div>
        {tableView && (
          <CSVLink
            data={filteredData}
            className="bg-primary border-primary px-4 py-[8px] text-sm text-white rounded-md"
          >
            Download Table
          </CSVLink>
        )}
      </div>
      <div className="data-timeline-container">
        {tableView ? (
          <div className="w-4/6 mt-7">
            <DataTableComponent
              filteredData={filteredData}
              fields={columns}
              style={{ border: "1px solid #e6e6e6" }}
              showGridlines={true}
              paginator={true}
              rows={10}
              rowsPerPageOptions={[10, 30, 40, 50]}
              tableStyle={{ minWidth: "50rem", borderRadius: "50px" }}
            />
          </div>
        ) : (
          <div className="max-w-full">
            <TimelineComponent value={filteredData} />
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
  const serviceEventFormId = process.env.NEXT_PUBLIC_SERVICE_EVENT_FORM_ID;
  const pageSize = 100;
  let allData = [];
  let serviceEventData = [];
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
      const serviceEventResponse = await fetch(
        `${baseURL}/form/2/${accountId}/${serviceEventFormId}/list?page_number=${page}&page_size=${pageSize}`,
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
      if (!serviceEventResponse.ok) {
        throw new Error(`HTTP error! status: ${serviceEventResponse.status}`);
      }

      const result = await response.json();
      const serviceEventResult = await serviceEventResponse.json();
      if (result.Data && result.Data.length > 0) {
        allData = allData.concat(result.Data);
      } else {
        break;
      }
      if (serviceEventResult.Data && serviceEventResult.Data.length > 0) {
        serviceEventData = serviceEventData.concat(serviceEventResult.Data);
      } else {
        break;
      }

      page++;
    }

    return {
      props: {
        result: { Data: allData },
        serviceEventResult: { Data: serviceEventData },
      },
    };
  } catch (error) {
    console.error("Failed to fetch KissFlow API data:", error);

    return {
      props: { result: { Data: [] }, serviceEventResult: { Data: [] } },
    };
  }
}
