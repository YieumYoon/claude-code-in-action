import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuth } from '@/hooks/use-auth';
import { signIn as signInAction, signUp as signUpAction } from '@/actions';
import { getAnonWorkData, clearAnonWork } from '@/lib/anon-work-tracker';
import { getProjects } from '@/actions/get-projects';
import { createProject } from '@/actions/create-project';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock actions
vi.mock('@/actions', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

// Mock anon work tracker
vi.mock('@/lib/anon-work-tracker', () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Mock project actions
vi.mock('@/actions/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('@/actions/create-project', () => ({
  createProject: vi.fn(),
}));

describe('useAuth', () => {
  const mockPush = vi.fn();
  const mockSignInAction = vi.mocked(signInAction);
  const mockSignUpAction = vi.mocked(signUpAction);
  const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
  const mockClearAnonWork = vi.mocked(clearAnonWork);
  const mockGetProjects = vi.mocked(getProjects);
  const mockCreateProject = vi.mocked(createProject);
  const mockUseRouter = vi.mocked(useRouter);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial state', () => {
    it('should return initial loading state as false', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in and handle post-signin with anonymous work', async () => {
      const mockAnonWork = {
        messages: [{ id: '1', content: 'test message' }],
        fileSystemData: { '/': { type: 'directory' } }
      };
      const mockProject = { id: 'project-123' };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password123');
        expect(response).toEqual({ success: true });
      });

      await waitFor(() => {
        expect(mockSignInAction).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockGetAnonWorkData).toHaveBeenCalled();
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from \d/),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/project-123');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should successfully sign in and navigate to most recent project when no anonymous work exists', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Recent Project' },
        { id: 'project-2', name: 'Older Project' }
      ];

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/project-1');
      });
    });

    it('should successfully sign in and create new project when no existing projects', async () => {
      const mockProject = { id: 'new-project-123' };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith('/new-project-123');
      });
    });

    it('should handle anonymous work with empty messages', async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: { '/': { type: 'directory' } }
      };
      const mockProjects = [{ id: 'project-1' }];

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockGetProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockCreateProject).not.toHaveBeenCalled();
        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/project-1');
      });
    });

    it('should handle sign in failure', async () => {
      const errorResult = { success: false, error: 'Invalid credentials' };
      mockSignInAction.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword');
        expect(response).toEqual(errorResult);
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during sign in', async () => {
      mockSignInAction.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true }), 100)
      ));
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'test' });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle errors during post-signin processing', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn('test@example.com', 'password123')).rejects.toThrow('Storage error');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should successfully sign up and handle post-signin with anonymous work', async () => {
      const mockAnonWork = {
        messages: [{ id: '1', content: 'test message' }],
        fileSystemData: { '/': { type: 'directory' } }
      };
      const mockProject = { id: 'project-123' };

      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password123');
        expect(response).toEqual({ success: true });
      });

      await waitFor(() => {
        expect(mockSignUpAction).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockGetAnonWorkData).toHaveBeenCalled();
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from \d/),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/project-123');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should successfully sign up and navigate to new project when no anonymous work', async () => {
      const mockProject = { id: 'new-project-456' };

      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith('/new-project-456');
      });
    });

    it('should handle sign up failure', async () => {
      const errorResult = { success: false, error: 'Email already registered' };
      mockSignUpAction.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password123');
        expect(response).toEqual(errorResult);
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during sign up', async () => {
      mockSignUpAction.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true }), 100)
      ));
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'test' });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signUp('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null anonymous work gracefully', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: 'existing-project' }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockClearAnonWork).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/existing-project');
      });
    });

    it('should handle createProject failure during anonymous work processing', async () => {
      const mockAnonWork = {
        messages: [{ id: '1', content: 'test message' }],
        fileSystemData: { '/': { type: 'directory' } }
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn('test@example.com', 'password123')).rejects.toThrow('Database error');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle getProjects failure', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn('test@example.com', 'password123')).rejects.toThrow('Network error');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should ensure loading state is always reset even on error', async () => {
      mockSignInAction.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn('test@example.com', 'password123')).rejects.toThrow('Network error');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle router.push failure gracefully', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: 'project-1' }]);
      mockPush.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn('test@example.com', 'password123')).rejects.toThrow('Navigation error');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Anonymous work scenarios', () => {
    it('should prioritize anonymous work over existing projects', async () => {
      const mockAnonWork = {
        messages: [{ id: '1', content: 'anonymous message' }],
        fileSystemData: { '/': { type: 'directory' }, '/test.js': { type: 'file', content: 'test' } }
      };
      const mockProject = { id: 'anon-project' };
      const existingProjects = [{ id: 'existing-project' }];

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);
      mockGetProjects.mockResolvedValue(existingProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from \d/),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(mockGetProjects).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/anon-project');
      });
    });

    it('should generate unique project names based on current time', async () => {
      const mockAnonWork = {
        messages: [{ id: '1', content: 'test' }],
        fileSystemData: { '/': { type: 'directory' } }
      };
      const mockProject = { id: 'time-project' };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      // Mock Date.prototype.toLocaleTimeString
      const mockToLocaleTimeString = vi.spyOn(Date.prototype, 'toLocaleTimeString');
      mockToLocaleTimeString.mockReturnValue('3:45:22 PM');

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'Design from 3:45:22 PM',
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
      });

      mockToLocaleTimeString.mockRestore();
    });

    it('should generate random project names for new projects', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'random-project' });

      // Mock Math.random
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.12345);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'New Design #12345',
          messages: [],
          data: {},
        });
      });

      mockRandom.mockRestore();
    });
  });
});