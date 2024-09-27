import { useMemo } from "react";

export const groupCosts = (data, costKey, quarterMapping) => {
  return data.reduce((acc, item) => {
    const description = item.Loco_Description || "Unknown";
    const date = item.Next_Due_Date;
    const costValue = item[costKey];

    if (date && typeof date === "string") {
      const [year, month] = date.split("-");
      const monthName = new Date(`${year}-${month}-01`).toLocaleString(
        "default",
        { month: "long" }
      );
      const quarter = Object.keys(quarterMapping).find((q) =>
        quarterMapping[q].includes(monthName)
      );
      const value =
        parseFloat(costValue?.replace(" EUR", "").replace(",", ".")) || 0;

      acc[description] = acc[description] || { description, years: {} };
      acc[description].years[year] = acc[description].years[year] || {
        total: 0,
        quarters: {},
      };
      acc[description].years[year].quarters[quarter] = acc[description].years[
        year
      ].quarters[quarter] || { total: 0, months: {} };

      acc[description].years[year].total += value;
      acc[description].years[year].quarters[quarter].total += value;
      acc[description].years[year].quarters[quarter].months[monthName] =
        (acc[description].years[year].quarters[quarter].months[monthName] ||
          0) + value;
    }

    return acc;
  }, {});
};

export const createGroupedData = (quarterMapping, filteredData) => {
  const laborCost = groupCosts(
    filteredData,
    "Estimated_Labor_Cost",
    quarterMapping
  );
  const toolCost = groupCosts(
    filteredData,
    "Estimated_Tool_Cost",
    quarterMapping
  );
  const serviceCost = groupCosts(
    filteredData,
    "Estimated_Service_Cost",
    quarterMapping
  );
  const itemCost = groupCosts(
    filteredData,
    "Estimated_Item_Cost",
    quarterMapping
  );

  const calculateTotalCosts = () => {
    const allCosts = [laborCost, toolCost, serviceCost, itemCost];
    const totalCosts = {};

    allCosts.forEach((costGroup) => {
      Object.entries(costGroup).forEach(([description, descriptionData]) => {
        totalCosts[description] = totalCosts[description] || {
          description,
          years: {},
        };

        Object.entries(descriptionData.years).forEach(([year, yearData]) => {
          const yearTotal = totalCosts[description].years[year] || {
            total: 0,
            quarters: {},
          };
          yearTotal.total += yearData.total;

          Object.entries(yearData.quarters).forEach(
            ([quarter, quarterData]) => {
              const quarterTotal = yearTotal.quarters[quarter] || {
                total: 0,
                months: {},
              };
              quarterTotal.total += quarterData.total;

              Object.entries(quarterData.months).forEach(
                ([month, monthValue]) => {
                  quarterTotal.months[month] =
                    (quarterTotal.months[month] || 0) + monthValue;
                }
              );

              yearTotal.quarters[quarter] = quarterTotal;
            }
          );

          totalCosts[description].years[year] = yearTotal;
        });
      });
    });

    return totalCosts;
  };

  const createGroup = (label, details) => ({
    label,
    details: Object.values(details ?? {}),
  });

  return [
    createGroup("Labor Cost", laborCost),
    createGroup("Tool Cost", toolCost),
    createGroup("Service Cost", serviceCost),
    createGroup("Item Cost", itemCost),
    createGroup("Total Cost", calculateTotalCosts()),
  ];
};

export const useAllYears = (groupedData) =>
  useMemo(
    () =>
      [
        ...new Set(
          groupedData.flatMap(({ details }) =>
            details.flatMap(({ years }) => Object.keys(years))
          )
        ),
      ].sort(),
    [groupedData]
  );
