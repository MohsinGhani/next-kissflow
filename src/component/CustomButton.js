import React from "react";
import { Button } from "primereact/button";

const CustomButton = ({ title, onClick, className }) => {
  return (
    <Button
      label={title}
      onClick={onClick}
      className={`${className} bg-transparent  cursor-pointer text-inherit focus:outline-none font-normal  focus:ring-0`}
    />
  );
};

export default CustomButton;
