"use-strict";

export function getCurrentDateFunc(dateSystem) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dev",
  ];
  const getCurrentMonth = new Date();
  const getCurrentDate = new Date();
  const getFullYear = new Date();
  const currentMonth = months[getCurrentMonth.getMonth()];
  const fetchingCurrentDate = getCurrentDate.getDate();
  const fetchCurrentYear = getFullYear.getFullYear();
  dateSystem.date = currentMonth + " " + fetchingCurrentDate + " " + fetchCurrentYear;
}