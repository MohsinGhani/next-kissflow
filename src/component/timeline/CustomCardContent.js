import React from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import moment from "moment";

const getDateAfterDays = (days) => moment().add(days, "days").toDate();

const CustomizedContent = (item) => {
  const {
    _id,
    WO_Number,
    Next_Due_Date,
    PM_Description,
    Loco_Description,
    service,
    Repair_Workshop,
  } = item;

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
                : service
                ? "service-card"
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
            <p
              className="card-description text-xs"
              title={Repair_Workshop?.Name}
            >
              {Repair_Workshop?.Name}
            </p>
          </Card>
        </>
      ) : (
        <>
          <Card
            key={_id}
            className={`simple-card ${service ? "service-card" : ""}`}
          >
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
            <p
              className="card-description text-xs"
              title={Repair_Workshop?.Name}
            >
              {Repair_Workshop?.Name}
            </p>
          </Card>
        </>
      )}
    </>
  );
};

export default CustomizedContent;
