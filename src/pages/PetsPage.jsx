import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { Coin } from '../components/game/GameArt'
import { gameApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { rarityLabel } from './StagePage'

const RARITY_STYLE = {
  COMMON: 'bg-surface-container text-on-surface-variant',
  RARE: 'bg-primary-fixed text-on-primary-fixed',
  EPIC: 'bg-[#efe3ff] text-[#5b2bb5]',
  LEGENDARY: 'bg-secondary-fixed text-on-secondary-fixed',
}
const CARD_BG = {
  COMMON: 'from-surface-container-low to-surface-container-lowest',
  RARE: 'from-[#dbe7ff] to-surface-container-lowest',
  EPIC: 'from-[#efe3ff] to-surface-container-lowest',
  LEGENDARY: 'from-[#fff1c7] to-surface-container-lowest',
}

/** Bộ sưu tập thú đồng hành: chọn thú đi cùng, đổi xu lấy thú mới */
export default function PetsPage() {
  const { user, patchUser } = useAuth()
  const [pets, setPets] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [justGot, setJustGot] = useState('')

  useEffect(() => {
    gameApi.pets().then(setPets).catch((e) => setError(getErrorMessage(e)))
  }, [])

  const activate = async (code) => {
    setBusy(code)
    setError('')
    try {
      const profile = await gameApi.setActivePet(code)
      patchUser({ activePetCode: profile.activePetCode })
      setPets((list) => list.map((p) => ({ ...p, active: p.code === code })))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy('')
    }
  }

  const buy = async (pet) => {
    setBusy(pet.code)
    setError('')
    try {
      const list = await gameApi.buyPet(pet.code)
      setPets(list)
      patchUser({ coins: (user?.coins || 0) - pet.priceCoins, activePetCode: pet.code })
      setJustGot(pet.code)
      setTimeout(() => setJustGot(''), 2500)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy('')
    }
  }

  if (!pets && !error) return <Loading />
  const owned = pets?.filter((p) => p.owned).length || 0

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      <section className="flex flex-col items-start justify-between gap-space-md rounded-[28px] bg-gradient-to-r from-[#fff1c7] to-primary-fixed p-space-lg sm:flex-row sm:items-center">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Chuồng thú đồng hành</h1>
          <p className="text-body-md text-on-surface-variant">Đã sưu tầm {owned}/{pets?.length || 0} bạn. Qua ải để kiếm xu, phá đảo ải trùm để mở thú hiếm.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-space-md py-space-sm text-headline-sm font-extrabold shadow-sm">
          <Coin size={26} /> {user?.coins ?? 0} xu
        </div>
      </section>

      <ErrorBox message={error} />

      <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 lg:grid-cols-5">
        {pets?.map((p) => (
          <div key={p.code} className={`relative flex flex-col items-center rounded-[24px] bg-gradient-to-b ${CARD_BG[p.rarity]} p-space-md text-center shadow-sm ${
            p.active ? 'ring-4 ring-primary' : ''} ${justGot === p.code ? 'pop-in' : ''}`}>
            <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_STYLE[p.rarity]}`}>{rarityLabel(p.rarity)}</span>
            {p.active && <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Đang đi cùng</span>}
            <Pet code={p.code} size={104} locked={!p.owned} bounce={p.active} className="mt-space-sm" />
            <div className="mt-1 text-label-lg font-extrabold text-on-surface">{p.owned ? p.name : '???'}</div>
            <div className="mt-0.5 min-h-[36px] text-body-sm text-on-surface-variant">{p.owned ? p.description : p.howToGet}</div>
            <div className="mt-space-sm w-full">
              {p.owned ? (
                <button type="button" disabled={p.active || busy === p.code} onClick={() => activate(p.code)}
                  className={`w-full rounded-xl py-2 text-label-md font-bold ${p.active ? 'bg-surface-container text-on-surface-variant' : 'bg-primary text-on-primary shadow-tactile'}`}>
                  {p.active ? 'Đang chọn' : 'Chọn đi cùng'}
                </button>
              ) : p.priceCoins ? (
                <button type="button" disabled={busy === p.code} onClick={() => buy(p)}
                  className={`flex w-full items-center justify-center gap-1 rounded-xl py-2 text-label-md font-bold ${
                    (user?.coins || 0) >= p.priceCoins ? 'bg-secondary-container text-on-secondary-container shadow-[0_3px_0_0_#b86e00]' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                  <Coin size={16} /> Đổi {p.priceCoins} xu
                </button>
              ) : (
                <span className="flex w-full items-center justify-center gap-1 rounded-xl bg-white/80 py-2 text-label-md text-on-surface-variant">
                  <Icon name="lock" className="text-[16px]" /> Rương ải trùm
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
