import React from "react";
import { Sidebar } from "primereact/sidebar";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

const SidebarComponent = ({
  visible,
  onHide,
  selectedLocoDescription,
  searchTerm,
  setSearchTerm,
  sidebarData,
  dataToDisplay,
}) => {
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };
  const groupedDataAll = dataToDisplay?.reduce((acc, item) => {
    const description = item.Loco_Description || "No Description";
    if (!acc.has(description)) acc.set(description, []);
    acc.get(description).push(item);
    return acc;
  }, new Map());

  const renderGroupedData = () =>
    Array.from(groupedDataAll.entries())?.map(([description, items]) => (
      <div key={description}>
        {sidebarData.costType && (
          <h2 className="text-xl font-bold my-5">{description}</h2>
        )}
        {items?.map((data) => (
          <div
            className="rounded-xl mt-4 border-2 border-gray-200"
            key={data.id}
          >
            <div className="text-xl font-medium mt-0 border-b border-gray-200">
              <h3 className="p-3 flex items-center rounded-t-xl text-white bg-gray-500 text-base">
                <i className="pi pi-calendar text-lg mr-2"></i>
                {formatDate(data.Next_Due_Date)}
              </h3>
            </div>
            <p className="text-base font-normal p-3">{data.PM_Description}</p>
          </div>
        ))}
      </div>
    ));
  return (
    <div className="card">
      <Sidebar visible={visible} position="right" onHide={onHide}>
        <h2 className="text-2xl mr-2 font-bold mb-4">
          {selectedLocoDescription}
        </h2>
        <IconField iconPosition="left" className="my-4">
          <InputIcon className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ..."
            className="w-full rounded-md"
          />
        </IconField>

        <div>
          {dataToDisplay?.length ? (
            renderGroupedData()
          ) : (
            <p className="text-lg font-medium">Nothing to Show!</p>
          )}
        </div>
      </Sidebar>
    </div>
  );
};

export default SidebarComponent;
