import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import classNames from 'classnames'
import { AnimatedNumber, Apr, Button, CellAmount, SVG, TextTooltip } from 'components/common'
import { convertPercentage } from 'functions'
import { formatValue } from 'libs/parse'
import Image from 'next/image'
import { useMemo } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { useTranslation } from 'react-i18next'

import styles from './useDepositColumns.module.scss'

export const useDepositColumns = () => {
  const { t } = useTranslation()
  const columnHelper = createColumnHelper<RedBankAsset>()

  const enableSorting = !isMobile && !isTablet

  const defaultDepositColumns: ColumnDef<RedBankAsset, any>[] = useMemo(() => {
    return [
      columnHelper.accessor('color', {
        enableSorting: false,
        header: '',
        cell: (info) => (
          <div
            className={`${styles.color} ${styles[info.row.original.symbol]} ${
              info.row.getIsExpanded() ? styles.expanded : ''
            }`}
          />
        ),
      }),
      columnHelper.accessor('logo', {
        enableSorting: false,
        header: '',
        cell: (info) => (
          <div className={styles.logo}>
            <Image alt='logo' src={info.getValue().src} width={32} height={32} />
          </div>
        ),
      }),
      columnHelper.accessor('name', {
        enableSorting: enableSorting,
        header: () => (
          <TextTooltip text={t('common.asset')} tooltip={t('redbank.tooltips.deposit.assets')} />
        ),
        id: 'name',
        cell: (info) => (
          <>
            <p className='m'>{info.row.original.symbol}</p>
            <p className='s faded'>{info.getValue()}</p>
          </>
        ),
      }),
      columnHelper.accessor('depositBalance', {
        enableSorting: enableSorting,
        header: () => (
          <TextTooltip
            text={t('common.deposited')}
            tooltip={t('redbank.tooltips.deposit.deposited')}
          />
        ),
        cell: (info) => {
          return (
            <CellAmount
              amount={Number(info.row.original.depositBalance)}
              decimals={info.row.original.decimals}
              denom={info.row.original.denom}
              noBalanceText={t('common.noDeposit')}
            />
          )
        },
      }),
      columnHelper.accessor('apy', {
        enableSorting: enableSorting,
        header: () => (
          <TextTooltip text={t('common.apr')} tooltip={t('redbank.tooltips.deposit.apy')} />
        ),
        cell: (info) => (
          <TextTooltip
            hideStyling
            text={
              <AnimatedNumber
                amount={info.getValue() + Number(info.row.original.incentiveInfo?.apy || 0)}
                suffix='%'
                abbreviated={false}
                rounded={false}
                className='m'
              />
            }
            tooltip={<Apr data={info.row.original} />}
          />
        ),
      }),
      columnHelper.accessor('depositCap', {
        enableSorting: enableSorting,
        header: () => (
          <TextTooltip
            text={t('redbank.depositCap')}
            tooltip={t('redbank.tooltips.deposit.caps')}
          />
        ),
        cell: ({ row }) => {
          const depositLiquidity = Number(row.original.depositLiquidity)
          const percent = convertPercentage((depositLiquidity / row.original.depositCap) * 100)
          const percentClasses = classNames(
            's',
            'number',
            'faded',
            percent >= 100 ? 'colorInfoLoss' : '',
          )

          return (
            <>
              <p className='number'>
                {formatValue(
                  row.original.depositCap / 10 ** row.original.decimals,
                  2,
                  2,
                  true,
                  false,
                )}
              </p>
              <p className={percentClasses}>
                {percent}% {t('common.used')}
              </p>
            </>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          return (
            <Button
              color='quaternary'
              prefix={row.getIsExpanded() ? <SVG.Collapse /> : <SVG.Expand />}
              variant='round'
            />
          )
        },
      }),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return defaultDepositColumns
}
