import {log, UpdateUser, User, UserData} from '@deckdeckgo/editor';
import {setData} from '../../services/data.services';

export const updateUser: UpdateUser = async (user: User): Promise<User> => {
  log({msg: '[update][start] user'});
  const t0 = performance.now();

  const updatedUser: User = await setData<UserData>({
    key: `/user`,
    idbData: user
  });

  const t1 = performance.now();
  log({msg: '[update][done] user', duration: t1 - t0});

  return updatedUser;
};
