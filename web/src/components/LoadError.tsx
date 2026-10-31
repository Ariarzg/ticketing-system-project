import { WarningCircleIcon } from '@phosphor-icons/react';
import { t } from '@/lib/strings.fa';
import { EmptyBox } from './EmptyBox';
import { LoadingButton } from './LoadingButton';

/** A page whose data did not load for a reason other than 404 (pages turn a 404 into a redirect, D11). */
export function LoadError({
	onRetry,
	retrying,
}: {
	onRetry: () => void;
	retrying: boolean;
}) {
	return (
		<div
			role="alert"
			className="rounded-2xl border border-border bg-surface"
		>
			<EmptyBox
				icon={<WarningCircleIcon size={24} />}
				title={t.errors.server}
				action={
					<LoadingButton
						size="sm"
						variant="secondary"
						isPending={retrying}
						onPress={onRetry}
					>
						{t.common.retry}
					</LoadingButton>
				}
			/>
		</div>
	);
}
