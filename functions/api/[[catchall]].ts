import worker from '../../src/worker/index';

export const onRequest: PagesFunction<any> = async (context) => {
  return worker.fetch(context.request, context.env, context);
};
