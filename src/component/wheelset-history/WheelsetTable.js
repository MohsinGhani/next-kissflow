import { Tooltip } from "primereact/tooltip";
import DataTableComponent from "@/component/DataTable";

const WheelsetTable = ({ filteredData, handleRowClick }) => {
  const getColumns = () => {
    const DColumns = Array.from({ length: 4 }, (_, i) => [
      { field: `D${i + 1}_LEFT`, header: `D${i + 1} LEFT` },
      { field: `D${i + 1}_RIGHT`, header: `D${i + 1} RIGHT` },
    ]).flat();

    return [
      {
        field: "Description",
        header: "Description",
        body: (rowData) => (
          <div className="flex justify-between min-w-20 mr-3 ">
            <Tooltip target=".custom-target-icon" />
            {rowData.Description}
            <i
              onClick={() => handleRowClick(rowData)}
              className="custom-target-icon pi pi-file-pdf text-xl cursor-pointer"
              data-pr-tooltip="Download Report"
              data-pr-position="right"
            />
          </div>
        ),
      },
      { field: "Measure_Date", header: "Measure Date" },
      ...DColumns,
    ];
  };

  const columns = getColumns();

  return (
    <DataTableComponent
      filteredData={filteredData}
      handleData={handleRowClick}
      style={{ width: "100%" }}
      showGridlines={true}
      fields={columns}
      paginator={true}
      rows={10}
      rowsPerPageOptions={[5, 10, 25]}
      tableStyle={{ minWidth: "50rem" }}
    />
  );
};

export default WheelsetTable;
