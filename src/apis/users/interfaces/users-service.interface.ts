import { IContext } from 'src/common/interfaces/context';

export interface IUsersServiceCreate {
  email: string;
  name: string;
}
export interface IUsersServiceFindOneByEmail {
  email: string;
}
export interface IUserServiceGetUserInfo {
  context: IContext;
}
