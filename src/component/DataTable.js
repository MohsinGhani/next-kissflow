import { DataTable, Column } from "primereact/datatable";

const DataTableComponent = ({
  filteredData,
  style,
  showGridlines,
  fields,
  paginator,
  rows,
  rowsPerPageOptions,
  tableStyle,
}) => {
  return (
    <DataTable
      value={filteredData}
      style={style}
      showGridlines={showGridlines}
      paginator={paginator}
      rows={rows}
      paginatorLeft
      rowsPerPageOptions={rowsPerPageOptions}
      tableStyle={tableStyle}
    >
      {fields?.map((col, i) => (
        <Column
          key={i}
          field={col.field}
          header={col.header}
          body={col.body}
          className={`cursor-default ${
            col.field === "Description" ? "w-[18rem]" : "w-40"
          }`}
        />
      ))}
    </DataTable>
  );
};
export default DataTableComponent;
