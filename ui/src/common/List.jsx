import React from 'react'
import { List as RAList } from 'react-admin'
import { Pagination } from './Pagination'
import { Title } from './index'

export const List = (props) => {
  const { resource, perPage } = props
  return (
    <RAList
      title={
        <Title
          subTitle={`resources.${resource}.name`}
          args={{ smart_count: 2 }}
        />
      }
      perPage={perPage ? perPage : 15}
      pagination={<Pagination />}
      {...props}
    />
  )
}
