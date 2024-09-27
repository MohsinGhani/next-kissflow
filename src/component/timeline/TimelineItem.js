import moment from "moment";
import { Tag } from "primereact/tag";

export const CustomizedMarker = (item) => {
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
