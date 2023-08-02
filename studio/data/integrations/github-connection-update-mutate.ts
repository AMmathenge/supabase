import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { UpdateConnection } from './integrations.types'
import { integrationKeys } from './keys'

export async function updateGithubConnection({
  id,
  metadata,
  organizationIntegrationId,
}: UpdateConnection) {
  const { data, error } = await patch('/platform/integrations/github/connections/{connection_id}', {
    params: {
      path: { connection_id: id },
    },
    body: {
      metadata,
    },
  })

  if (error) throw error
  return data
}

type UpdateGithubConnectionData = Awaited<ReturnType<typeof updateGithubConnection>>

export const useGithubConnectionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateGithubConnectionData, ResponseError, UpdateConnection>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateGithubConnectionData, ResponseError, UpdateConnection>(
    (vars) => updateGithubConnection(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(
            integrationKeys.githubConnectionsList(variables.organizationIntegrationId)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update Github connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
