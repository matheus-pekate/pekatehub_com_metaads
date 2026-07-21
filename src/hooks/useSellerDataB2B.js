import { PROGRAMS_B2B } from '../config/pipedrive.js'
import { createSellerDataHook } from './useSellerData.js'

export const SELLERS_B2B = [
  { id: 11572121, name: 'Andressa Lucas' },
  { id: 9892007, name: 'Leonardo Ramos Teixeira' },
  { id: 11572131, name: 'Maylla Batista' },
]

export const useSellerDataB2B = createSellerDataHook(SELLERS_B2B, PROGRAMS_B2B)
