import { useEffect, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { FloatLabel } from "primereact/floatlabel";
import { Dropdown } from "primereact/dropdown";
import CustomButton from "@/component/CustomButton";
import ChartComponent from "@/component/Chart";
import WheelsetTable from "@/component/wheelset-history/WheelsetTable";

const transformAndGroupData = (data) => {
  const transformedData = data?.map(
    ({ Locomotive_Number, Work_Order, ...rest }) => ({
      Name: Locomotive_Number?.Name || "-",
      Locomotive_id: Locomotive_Number?._id || "-",
      Work_Order_Name: Work_Order?.Name || "-",
      Work_Order_Number: Work_Order?.wonum || "-",
      Measure_Date: rest.Measure_Date || "-",
      D_LEFT: rest.D_LEFT || 0,
      D_RIGHT: rest.D_RIGHT || 0,
      Homologation_Date: Locomotive_Number?.Homologation_Date || "-",
      Position: rest.Position || "-",
      ...rest,
    })
  );

  const groupedData = transformedData.reduce((acc, item) => {
    const { Measure_Date: dateKey = "-", Locomotive_id: locoIdKey = "-" } =
      item;
    const compositeKey = `${dateKey}_${locoIdKey}`;

    if (!acc[compositeKey]) {
      acc[compositeKey] = {
        Description: item.Name || "-",
        Measure_Date: dateKey,
        Locomotive_Number: item.Locomotive_Number?.Locomotive_Number || "-",
        Locomotive_id: locoIdKey,
        Homologation_Date: item.Homologation_Date || "-",
        Work_Order_Name: item.Work_Order_Name || "-",
        ...Object.fromEntries(
          Array.from({ length: 4 }, (_, i) =>
            ["D", "H", "QR", "SH", "SD", "SR"].flatMap((type) => [
              [`${type}${i + 1}_LEFT`, 0],
              [`${type}${i + 1}_RIGHT`, 0],
            ])
          ).flat()
        ),
      };
    }

    const pos = item.Position?.split(" ")[1];
    ["D", "H", "QR", "SH", "SD", "SR"].forEach((type) => {
      const prefix = `${type}${pos}`;
      acc[compositeKey][`${prefix}_LEFT`] += item[`${type}_LEFT`] || 0;
      acc[compositeKey][`${prefix}_RIGHT`] += item[`${type}_RIGHT`] || 0;
    });

    return acc;
  }, {});

  return Object.values(groupedData).sort(
    (a, b) => new Date(a.Measure_Date) - new Date(b.Measure_Date)
  );
};
const WheelsetHistory = ({ result }) => {
  const [showGraph, setShowGraph] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedDescription, setSelectedDescription] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const transformedGroupedData = transformAndGroupData(result.Data);

  const pdfUrlLocal = "/wheelSetForm.pdf";

  useEffect(() => {
    (async () => {
      const response = await fetch(pdfUrlLocal);
      const arrayBuffer = await response.arrayBuffer();
      setPdfFile(arrayBuffer);
    })();
  }, []);

  useEffect(() => {
    if (uniqueDescriptions.length > 0) {
      setSelectedDescription(uniqueDescriptions[0]);
    }
  }, []);

  useEffect(() => {
    const filter = selectedDescription
      ? transformedGroupedData.filter(
          (item) => item.Description === selectedDescription
        )
      : transformedGroupedData;
    setFilteredData(filter);
  }, [selectedDescription]);

  const modifyAndDownloadPdf = async () => {
    if (!pdfFile) return;

    try {
      const pdfDoc = await PDFDocument.load(pdfFile);
      const page = pdfDoc.getPages()[0];

      const {
        Locomotive_Number: locoNumber,
        Mileage,
        Operating_Company: companyText,
      } = selectedRow;

      const positions = [
        { name: "SD", y: 380 },
        { name: "SH", y: 360 },
        { name: "QR", y: 343 },
        { name: "D", y: 325 },
        { name: "H", y: 305 },
      ];
      const textToDraw = [
        { text: locoNumber, x: 420, y: 750, size: 10 },
        { text: companyText, x: 150, y: 720, size: 10 },
        { text: Mileage, x: 420, y: 720, size: 10 },
      ];
      textToDraw.forEach(({ text, x, y, size }) => {
        page.drawText(text?.toString() || "-", {
          x,
          y,
          size,
          color: rgb(0, 100 / 255, 0),
        });
      });
      const drawTextGroup = (groupName, y) => {
        for (let i = 1; i <= 4; i++) {
          const left = selectedRow[`${groupName}${i}_LEFT`];
          const right = selectedRow[`${groupName}${i}_RIGHT`];
          const leftX = 140 + (i - 1) * 100;
          const rightX = 190 + (i - 1) * 100;

          page.drawText(left?.toString() || "-", {
            x: leftX,
            y,
            size: 8,
            color: rgb(139 / 255, 0, 0),
          });
          page.drawText(right?.toString() || "-", {
            x: rightX,
            y,
            size: 8,
            color: rgb(139 / 255, 0, 0),
          });
        }
      };

      positions.forEach((pos) => drawTextGroup(pos.name, pos.y));

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Wheel_inspection_report.pdf";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error modifying PDF:", error);
    }
  };

  const charts = Array.from({ length: 4 }, (_, i) => [
    { dataKey: `D${i + 1}_LEFT`, label: `D${i + 1} LEFT` },
    { dataKey: `D${i + 1}_RIGHT`, label: `D${i + 1} RIGHT` },
  ]).flat();

  const handleRowClick = (rowData) => {
    const updatedData = {
      ...rowData,
      Locomotive_Number: "Loco-v1",
      Company_Operator: "Company Name",
      Mileage: "1000 km",
      Operating_Company: "Operating Company Name",
    };
    setSelectedRow(updatedData);
    modifyAndDownloadPdf();
  };

  const uniqueDescriptions = [
    ...new Set(transformedGroupedData?.map((item) => item.Description)),
  ];

  return (
    <div className="flex flex-col p-14">
      <div className="w-full flex justify-center">
        <div className="w-1/4">
          <FloatLabel>
            <Dropdown
              value={selectedDescription}
              onChange={(e) => setSelectedDescription(e.value)}
              options={uniqueDescriptions?.map((description) => ({
                label: description,
                value: description,
              }))}
              placeholder="Select Locomotive Number"
              className="w-full"
            />
            <label htmlFor="dropdown-loco">Descriptions</label>
          </FloatLabel>
        </div>
      </div>

      <div className="w-full flex justify-end gap-2">
        <CustomButton
          title={
            <>
              {showGraph ? "Hide Graph" : "Show Graph"}
              <i
                className={`pi ${
                  showGraph ? "pi-angle-up" : "pi-angle-down"
                } ml-3`}
              />
            </>
          }
          className="border border-gray-200 my-2 rounded-md p-2 px-6 text-lg font-normal flex items-center"
          onClick={() => setShowGraph(!showGraph)}
        />
      </div>

      <div className="w-full">
        <WheelsetTable
          filteredData={filteredData}
          handleRowClick={handleRowClick}
        />
      </div>

      {showGraph && (
        <div className="grid grid-cols-2 my-3 p-3 gap-12 border border-gray-100">
          {charts?.map((chart, index) => (
            <ChartComponent
              key={index}
              data={filteredData}
              dataKey={chart.dataKey}
              label={chart.label}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export async function getServerSideProps() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;
  const formId = process.env.NEXT_PUBLIC_WHEELSET_MEASURMENT_FORM_ID;
  const pageSize = 100;
  let allData = [];
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.Data && result.Data.length > 0) {
        allData = allData.concat(result.Data);
      } else {
        break;
      }

      page++;
    }

    return {
      props: { result: { Data: allData } },
    };
  } catch (error) {
    console.error("Failed to fetch KissFlow API data:", error);

    return {
      props: { result: { Data: [] } },
    };
  }
}

export default WheelsetHistory;
