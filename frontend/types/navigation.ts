export type RootStackParamList = {
  GetStarted: undefined;
  AddHome: undefined;
  AddAppliances: { homeId: string };
  HomeDashboard: { homeId: string };
  AppliancesList: { homeId: string; nickname?: string };
  Placeholder: { title: string };
};
