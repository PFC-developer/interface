import { Button, DisplayCurrency, InputSlider } from 'components/common'
import { formatValue, lookup, lookupSymbol, parseNumberInput } from 'libs/parse'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CurrencyInput from 'react-currency-input-field'
import { useTranslation } from 'react-i18next'
import useStore from 'store'
import { ViewType } from 'types/enums'

import styles from './InputSection.module.scss'

interface Props {
  asset: RedBankAsset
  availableText: string
  amount: number
  maxUsableAmount: number
  actionButton: ReactNode
  checkForMaxValue?: boolean
  disabled?: boolean
  amountUntilDepositCap: number
  activeView: ViewType
  inputCallback: (value: number) => void
  onEnterHandler: () => void
  setAmountCallback: (value: number) => void
}

export const InputSection = ({
  asset,
  availableText,
  amount,
  maxUsableAmount,
  actionButton,
  checkForMaxValue = false,
  disabled,
  amountUntilDepositCap,
  activeView,
  inputCallback,
  onEnterHandler,
  setAmountCallback,
}: Props) => {
  // ------------------
  // EXTERNAL HOOKS
  // ------------------
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  // ------------------
  // STORE STATE
  // ------------------
  const baseCurrency = useStore((s) => s.baseCurrency)
  const whitelistedAssets = useStore((s) => s.whitelistedAssets)

  // ------------------
  // LOCAL STATE
  // ------------------
  const [sliderValue, setSliderValue] = useState(0)
  const [depositWarning, setDepositWarning] = useState(false)
  const [fakeAmount, setFakeAmount] = useState<string | undefined>()

  // ------------------
  // VARIABLES
  // ------------------

  const sliderEnabled = useMemo(() => maxUsableAmount > 1, [maxUsableAmount])

  // If within 50ms of our last update for the slider, return the cached value.
  // This prevents a 'flicker' of the display label when we finish dragging while hovering
  const sliderDisplayValue = useMemo(() => {
    const amountToSet = (amount / maxUsableAmount) * 100
    return amountToSet >= 100 ? amountToSet + Math.random() : amountToSet
  }, [amount, maxUsableAmount])

  // -----------------------
  // Callbacks
  // -----------------------

  const onSliderDragged = useMemo(
    () => (value: number) => {
      const selectedValue = value / 100
      setAmountCallback(maxUsableAmount * selectedValue)
      if (checkForMaxValue) {
        setSliderValue(value)
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [setAmountCallback, maxUsableAmount],
  )

  useEffect(() => {
    if (inputRef?.current) inputRef.current.focus()
  }, [])

  useEffect(
    () => {
      if (
        amount >= maxUsableAmount &&
        asset.denom === baseCurrency.denom &&
        !depositWarning &&
        checkForMaxValue
      ) {
        setDepositWarning(true)
      } else {
        setDepositWarning(false)
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [sliderValue, amount, maxUsableAmount],
  )

  // -------------
  // Presentation
  // -------------

  const produceUpperInputInfo = () => {
    return (
      <Button
        color='quaternary'
        className={`overline ${styles.available}`}
        onClick={() => setAmountCallback(maxUsableAmount)}
        text={availableText}
        variant='transparent'
      />
    )
  }

  const suffix = lookupSymbol(asset.denom, whitelistedAssets || []) || asset.denom

  const produceWarningComponent = useCallback(() => {
    let text = ''
    switch (activeView) {
      case ViewType.Deposit:
        text =
          amountUntilDepositCap <= 0
            ? t('redbank.warning.depositCapReached', {
                symbol: asset.symbol,
              })
            : amount > amountUntilDepositCap
            ? t('redbank.warning.depositCap', {
                symbol: asset.symbol,
                amount: amountUntilDepositCap / 10 ** asset.decimals,
              })
            : ''
        break
      case ViewType.Withdraw:
        text = maxUsableAmount < 1 ? t('redbank.warning.withdraw') : ''
        break
      case ViewType.Borrow:
        text = maxUsableAmount < 1 ? t('redbank.warning.borrow') : ''
        break
    }

    return <span className={`${styles.warning}`}>{text}</span>
  }, [activeView, amountUntilDepositCap, amount, asset, t, maxUsableAmount])

  return (
    <div>
      {/* INPUT SECTION */}
      <div className={styles.container}>
        {produceUpperInputInfo()}

        <div className={styles.inputWrapper}>
          <CurrencyInput
            allowNegativeValue={false}
            autoFocus={true}
            className={`h4 number ${styles.inputPercentage}`}
            decimalSeparator='.'
            decimalsLimit={asset.decimals}
            disableAbbreviations={true}
            disabled={disabled}
            groupSeparator=','
            name='currencyInput'
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                onEnterHandler()
              }
            }}
            onValueChange={(value) => {
              if (value?.charAt(value.length - 1) !== '.') {
                inputCallback(parseNumberInput(value))
                setFakeAmount(undefined)
              } else {
                setFakeAmount(value)
              }
            }}
            placeholder='0'
            suffix={` ${suffix}`}
            value={
              fakeAmount
                ? fakeAmount
                : amount
                ? lookup(
                    Number(formatValue(amount, 0, 0, false, false, false, false, false)),
                    asset.denom,
                    asset.decimals,
                  )
                : ''
            }
          />
        </div>
        <DisplayCurrency
          className={`overline ${styles.inputRaw}`}
          coin={{ amount: amount.toString(), denom: asset.denom }}
        />
        <div className={styles.inputContainer}>
          <button
            className={`${styles.sliderButton} ${styles.zero}`}
            disabled={disabled}
            onClick={() => setAmountCallback(0)}
          >
            0
          </button>
          <div className={styles.input}>
            <InputSlider
              disabled={disabled}
              enabled={sliderEnabled}
              onChange={onSliderDragged}
              value={sliderDisplayValue}
            />
            {depositWarning && (
              <div className={styles.inputWarning}>
                <p className='tippyContainer'>{t('common.lowUstAmountAfterTransaction')}</p>
              </div>
            )}
          </div>
          <button
            className={`caption ${styles.sliderButton}`}
            disabled={disabled}
            onClick={() => setAmountCallback(maxUsableAmount)}
          >
            {t('global.max')}
          </button>
        </div>
        {produceWarningComponent()}
        <div className={styles.actionButton}>{actionButton}</div>
      </div>
    </div>
  )
}
