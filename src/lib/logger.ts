// A simple logger implementation
const logger = {
  error: (obj: any, msg: string) => {
    console.error(msg, obj);
  },
  info: (obj: any, msg: string) => {
    console.log(msg, obj);
  },
  warn: (obj: any, msg: string) => {
    console.warn(msg, obj);
  },
  debug: (obj: any, msg: string) => {
    console.debug(msg, obj);
  },
};

export default logger;