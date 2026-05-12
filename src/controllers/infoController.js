export const getAbout = (req, res) => {
  res.json({ status: "ok", message: "ReccoFlix API is running" });
};

export const getPrivacy = (req, res) => {
  res.json({ message: "Privacy Policy data" });
};

export const getTerms = (req, res) => {
  res.json({ message: "Terms of Service data" });
};
