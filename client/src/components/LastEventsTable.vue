<template>
	<div class="container">
		<b-table
				:data="events"
				ref="table"
				hoverable
				paginated
				per-page="10"
				:current-page.sync="currentPage"
				pagination-position="bottom"
				:default-sort="['time', 'desc']"
				sort-icon="arrow-up"
				sort-icon-size="is-small"
				aria-next-label="Next page"
				aria-previous-label="Previous page"
				aria-page-label="Page"
				aria-current-label="Current page"
		>
			<template slot-scope="props">
				<b-table-column field="event" label="Event">
					{{props.row.message}}
				</b-table-column>
				<b-table-column field="status" label="Status"  >
					<b-tag v-if="props.row.is_confirmed" type="is-success">{{$t('lastEventsTableTagConfirmed')}}</b-tag>
					<b-tag v-else type="is-warning">{{$t('lastEventsTableTagUnconfirmed')}}</b-tag>
				</b-table-column>
				<b-table-column field="time" label="Time" sortable>
					{{moment().to(props.row.time)}}
				</b-table-column>
				<b-table-column field="unit" label="Unit">
					<unit-link :unit="props.row.unit"/>
				</b-table-column>
			</template>
			<template slot="empty">
				<section class="section">
					<div class="content has-text-grey has-text-centered">
						<p>
							<b-icon
								icon="emoticon-sad"
								size="is-large">
							</b-icon>
						</p>
						<p>{{$t("commonEmptyTable")}}</p>
					</div>
				</section>
			</template>
		</b-table>
	</div>
</template>

<script>

	const conf = require('../conf.js')
	import getEventMessage from '../mixins/eventMessage'
	import moment from 'moment/src/moment'
	import UnitLink from './commons/UnitLink.vue'

	export default {
		mixins:[getEventMessage],
		components: {
			UnitLink
		},
		data () {
			return {
				isTestnet: conf.testnet,
				isSpinnerActive: true,
				currentPage: 1,
				totalRows: 0,
				defaultSortDirection: 'desc',
				events: [],
			}
		},
		created () {
			this.getData()
			this.timerId = setInterval(this.getData, 60000)
		},
		beforeDestroy () {
			clearInterval(this.timerId)
		},
		methods: {
			moment: moment,
			getData () {
				this.axios.get('/api/last-events').then((response) => {
					this.events = response.data.map((event)=>{
						return {
							message: this.getEventMessage(event), 
							is_confirmed: event.is_confirmed,
							time: moment.unix(event.timestamp),
							unit: event.trigger_unit
						}
					})
					this.totalRows = this.events.length
				})
			},
		},
	}
</script>

<style>

</style>
