import {
  CreateTemplate,
  GetUserTemplates,
  Template,
  TemplateData,
  UpdateTemplate
} from '@deckdeckgo/editor';
import {nanoid} from 'nanoid';
import {entries} from '../../api/data.api';
import {setData} from '../../services/data.services';

export const getUserTemplates: GetUserTemplates = (_userId: string): Promise<Template[]> =>
  entries<TemplateData>({startsWith: '/templates/'});

export const createTemplate: CreateTemplate = (data: TemplateData): Promise<Template> => {
  const id: string = nanoid();

  const now: Date = new Date();

  const template: Template = {
    id,
    data: {
      ...data,
      updated_at: now,
      created_at: now
    }
  };

  return setData<TemplateData>({key: `/templates/${id}`, entity: template});
};

export const updateTemplate: UpdateTemplate = (template: Template): Promise<Template> => {
  const {id} = template;

  return setData<TemplateData>({key: `/templates/${id}`, entity: template});
};
