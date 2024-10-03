import { Card } from "primereact/card";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressSpinner } from "primereact/progressspinner";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const redirectPageData = [
    {
      id: 1,
      name: "Timeline",
      routeUrl: "/timeline",
    },
    {
      id: 2,
      name: "Cost Estimation",
      routeUrl: "/cost-estimation",
    },
    {
      id: 3,
      name: "Wheelset Measurement",
      routeUrl: "/wheelset-history",
    },
  ];

  return (
    <div className="h-[90vh] w-full flex flex-col justify-center items-center">
      {loading ? (
        <div className="flex justify-center items-center text-xl">
          Redirecting{" "}
          <ProgressSpinner style={{ width: "50px", height: "30px" }} />
        </div>
      ) : (
        <>
          <div className="flex">
            {redirectPageData.map((redirectPage) => (
              <Card
                className="p-2 m-2 w-80 text-xl text-text-medium  rounded-xl border border-gray-300 shadow-lg cursor-pointer hover:border-primary hover:shadow-2xl hover:text-primary transition-colors duration-300"
                key={redirectPage.id}
                onClick={() => {
                  setLoading(true);
                  router.push(redirectPage.routeUrl);
                }}
              >
                <h2>{redirectPage.name}</h2>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
