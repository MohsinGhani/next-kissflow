import React from "react";
import { Timeline } from "primereact/timeline";
import CustomizedContent from "./CustomCardContent";
import { CustomizedMarker } from "./TimelineItem";

const TimelineComponent = ({ value }) => {
  const customizedContent = (item) => <CustomizedContent {...item} />;

  return (
    <div className="timeline-container">
      <Timeline
        value={value}
        content={customizedContent}
        align="alternate"
        layout="horizontal"
        opposite={<span>&nbsp;</span>}
        className="data-timeline"
        marker={CustomizedMarker}
      />
    </div>
  );
};

export default TimelineComponent;
