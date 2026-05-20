import { invoke } from '@tauri-apps/api/core'
import type { User } from './mock-data'

export async function getUsers(): Promise<User[]> {
  return invoke<User[]>('get_users')
}