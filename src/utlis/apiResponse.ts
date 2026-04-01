export const sendResponse = (
  res: any,
  statusCode: number,
  message: string,
  data: any = null,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
