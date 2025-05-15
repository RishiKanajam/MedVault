export type ModuleToggles = {
  inventory: boolean;
  shipments: boolean;
  rxai: boolean;
  pharmanet: boolean;
  history: boolean;
};

export type ClinicSettings = {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
};

export type UserSettings = {
  modules: ModuleToggles;
}; 