export type CmsPageResponse = {
  id: number;
  slug: string;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
};

export type CmsPageNavigationItem = {
  slug: string;
  title: string;
};
