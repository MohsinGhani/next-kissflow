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
  dataToDisplay,
  renderGroupedData,
}) => {
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
