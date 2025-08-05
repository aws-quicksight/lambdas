const jsonStringReplace = (originJson: string, search: string, replace: string): string => {
  return originJson.replaceAll(search, replace);
};

export default jsonStringReplace;
