import api from './api';

export const invitationService = {
  createInvitation: (role: string) => {
    return api.post('/invitations', { role });
  },
  getMyInvitations: () => {
    return api.get('/invitations/my');
  },
  checkCode: (code: string) => {
    return api.get(`/invitations/check/${code}`, { params: { code } });
  },
  getStatistics: () => {
    return api.get('/invitations/statistics');
  },
  getAllInvitations: (params?: { page?: number; pageSize?: number }) => {
    return api.get('/invitations', { params });
  },
};
